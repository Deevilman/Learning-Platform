import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
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
    case 'expression':
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
  it('has at least 40 generators (TypeScript + templates) with unique ids', () => {
    const templates = readdirSync(join(ROOT, 'content/templates')).map((f) => f.replace(/\.yaml$/, ''))
    expect(generators.length + templates.length).toBeGreaterThanOrEqual(40)
    for (const t of templates) expect(generators.some((g) => g.id === t), t).toBe(false)
    expect(new Set(generators.map((g) => g.id)).size).toBe(generators.length)
  })

  for (const g of generators) {
    describe(g.id, () => {
      it('belongs to an existing course and topics', () => {
        const file = join(ROOT, 'content/courses', `${g.course}.md`)
        expect(existsSync(file), `course ${g.course}`).toBe(true)
        const fm = readFileSync(file, 'utf8').split('\n---\n')[0].replace(/^---\n/, '')
        const topics = new Set((YAML.parse(fm).topics || []).map((t: { id: string }) => t.id))
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

// ---------- multiple choice: every generated variant must have exactly one correct option
import { generatedChoices } from '@/lib/generators'
import { makeChoices } from '@/lib/choices'

/** Grade an option string the way a learner typing it would be graded. */
function optionIsCorrect(check: AutoCheck, option: string): boolean {
  // options are Danish: "1.024,5" — make the thousands dots unambiguous for the parser
  const text = option.replace(/−/g, '-').replace(/(\d)\.(?=\d{3}\b)/g, '$1').replace(/\s*(kr\.?|bp|år|dage|USD|mio\.|%)$/i, (m) => (m.includes('%') && check.type === 'numeric' && check.unit === '%' ? '' : m.includes('%') ? m : ''))
  return evaluate(check, text).correct
}

describe('multiple-choice variants', () => {
  for (const g of generators)
    it(`${g.id}: four distinct options, exactly one correct`, () => {
      let made = 0
      for (const d of g.difficulties)
        for (let seed = 1; seed <= 25; seed++) {
          const ex = g.generate(seed, d)
          expect(ex.hint.trim().length, `${g.id} mangler hint`).toBeGreaterThan(5)
          const c = generatedChoices(ex, seed)
          if (!c) {
            // Only free-text answers without distractors may lack a multiple-choice version.
            expect(['text', 'output']).toContain(ex.check.type)
            continue
          }
          made++
          expect(c.options).toHaveLength(ex.check.type === 'choice' ? ex.check.options.length : 4)
          expect(new Set(c.options).size).toBe(c.options.length)
          if (ex.check.type === 'choice') {
            expect(c.correct).toBe(ex.check.correct)
            continue
          }
          const correct = c.options.map((o) => optionIsCorrect(ex.check, o))
          expect(correct.filter(Boolean), `${g.id} d${d} seed ${seed}: ${c.options.join(' | ')}`).toHaveLength(1)
          expect(correct[c.correct]).toBe(true)
        }
      expect(made, `${g.id} laver ingen multiple choice`).toBeGreaterThan(0)
    })

  it('uses supplied distractors first and is deterministic', () => {
    const check: AutoCheck = { type: 'numeric', answer: 2.5, tolerance: 0.05, unit: '%' }
    const a = makeChoices(check, 'quant/10/10.2', [35, -7.5])!
    expect(a.options).toContain('35,0\u00a0%')
    expect(a.options).toContain('−7,5\u00a0%')
    expect(a.options[a.correct]).toBe('2,5\u00a0%')
    expect(makeChoices(check, 'quant/10/10.2', [35, -7.5])).toEqual(a)
  })
})
