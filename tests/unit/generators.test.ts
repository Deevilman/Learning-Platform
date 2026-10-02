import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yaml'
import { generators, da } from '@/lib/generators'
import { evaluate } from '@/lib/check'
import { miniMarkdown } from '@/lib/mini-md'
import type { AutoCheck } from '@/types/content'

const ROOT = join(import.meta.dirname, '../..')
const SEEDS = 200

function correctAnswer(c: AutoCheck): string {
  switch (c.type) {
    case 'numeric':
      return String(c.answer).replace('.', ',')
    case 'numeric-list':
      return c.answers.map((x) => String(x).replace('.', ',')).join('; ')
    case 'choice':
      return String(c.correct)
    case 'text':
      return c.answers[0]
    case 'output':
      return c.expected
  }
}

/** The number as it may be written in the solution text. */
function renderings(x: number): string[] {
  const out = new Set<string>([String(x), String(x).replace('.', ',')])
  for (let k = 0; k <= 6; k++) out.add(da(x, k))
  return [...out]
}

const BAD = /NaN|undefined|Infinity|\[object|null/

describe('generators', () => {
  it('has at least 40 generators with unique ids', () => {
    expect(generators.length).toBeGreaterThanOrEqual(40)
    expect(new Set(generators.map((g) => g.id)).size).toBe(generators.length)
  })

  for (const g of generators) {
    describe(g.id, () => {
      it('belongs to an existing course and topics', () => {
        const file = join(ROOT, 'content/courses', g.course, 'course.yaml')
        expect(existsSync(file), `course ${g.course}`).toBe(true)
        const topics = new Set((YAML.parse(readFileSync(file, 'utf8')).topics || []).map((t: { id: string }) => t.id))
        for (const t of g.topics) expect(topics.has(t), `topic ${t}`).toBe(true)
        expect(g.difficulties.length).toBeGreaterThan(0)
      })

      for (const d of g.difficulties) {
        it(`difficulty ${d}: ${SEEDS} seeds are valid, consistent and deterministic`, () => {
          const prompts = new Set<string>()
          for (let seed = 1; seed <= SEEDS; seed++) {
            const ex = g.generate(seed * 7919, d)
            const again = g.generate(seed * 7919, d)
            expect(again).toEqual(ex)
            const ctx = `${g.id} d=${d} seed=${seed * 7919}`
            for (const [k, v] of Object.entries({ prompt: ex.prompt, solution: ex.solution, hint: ex.hint || '' })) {
              expect(BAD.test(v), `${ctx}: ${k} contains ${v.match(BAD)?.[0]}\n${v}`).toBe(false)
            }
            expect(ex.prompt.length).toBeGreaterThan(10)
            expect(ex.solution.length).toBeGreaterThan(10)
            // The check accepts its own answer…
            const res = evaluate(ex.check, correctAnswer(ex.check))
            expect(res.correct, `${ctx}: check rejects its own answer`).toBe(true)
            // …and the solution states the same answer.
            const c = ex.check
            if (c.type === 'numeric') {
              expect(Number.isFinite(c.answer), ctx).toBe(true)
              expect(renderings(c.answer).some((r) => ex.solution.includes(r)), `${ctx}: solution does not state ${c.answer}\n${ex.solution}`).toBe(true)
            } else if (c.type === 'numeric-list') {
              for (const a of c.answers) expect(renderings(a).some((r) => ex.solution.includes(r)), `${ctx}: solution lacks ${a}`).toBe(true)
            } else if (c.type === 'choice') {
              expect(c.correct).toBeGreaterThanOrEqual(0)
              expect(c.correct).toBeLessThan(c.options.length)
              expect(new Set(c.options).size, `${ctx}: duplicate options`).toBe(c.options.length)
            } else if (c.type === 'text') {
              expect(ex.solution.includes(c.answers[0]), ctx).toBe(true)
            }
            // KaTeX renders everything.
            for (const s of [ex.prompt, ex.solution, ex.hint || '']) expect(miniMarkdown(s).includes('katex-error'), `${ctx}: KaTeX error in\n${s}`).toBe(false)
            prompts.add(ex.prompt)
          }
          // Plenty of variety (pools of named cases are allowed to be small).
          expect(prompts.size, `${g.id} d=${d}: only ${prompts.size} distinct prompts`).toBeGreaterThanOrEqual(4)
        })
      }
    })
  }
})
