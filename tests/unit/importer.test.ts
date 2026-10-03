import { describe, it, expect, beforeAll } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildContent, type BuildReport } from '../../scripts/build-content'
import { parsePlan } from '../../scripts/lib/plan-parser'
import { normaliseDisplayMath } from '../../scripts/lib/markdown'
import { evaluate } from '../../src/lib/check'

const ROOT = join(import.meta.dirname, '../..')

describe('content pipeline', () => {
  let report: BuildReport
  let out: string
  beforeAll(() => {
    out = mkdtempSync(join(tmpdir(), 'lp-data-'))
    report = buildContent({ root: ROOT, out })
  }, 120000)

  it('builds without validation errors', () => {
    expect(report.errors).toEqual([])
    expect(report.ok).toBe(true)
  })

  it('reports the expected counts for the three plans', () => {
    const by = Object.fromEntries(report.courses.map((c) => [c.slug, c]))
    expect(by.foundations).toMatchObject({ weeks: 14, exercises: 177, solutions: 177, selftest: 20 })
    expect(by.quant).toMatchObject({ weeks: 16, exercises: 205, solutions: 205, selftest: 20, interview: 15 })
    expect(by.hedgefund).toMatchObject({ weeks: 12, exercises: 146, solutions: 146, selftest: 20 })
  })

  it('emits week chunks with exercises, solutions, KaTeX and videos', () => {
    const w = JSON.parse(readFileSync(join(out, 'courses/quant/week-14.json'), 'utf8'))
    expect(w.exercises.length).toBe(14)
    expect(w.exercises.every((e: { solution: string }) => e.solution.length > 0)).toBe(true)
    expect(w.notes).toContain('class="katex')
    expect(w.videos[0].sources[0].youtube).toMatch(/^[\w-]{11}$/)
    const idx = JSON.parse(readFileSync(join(out, 'index.json'), 'utf8'))
    expect(idx.exercises.length).toBe(177 + 205 + 146 + 20 + 20 + 15 + 20)
  })

  it('places every interactive directive and renders mermaid placeholders', () => {
    const w1 = readFileSync(join(out, 'courses/foundations/week-1.json'), 'utf8')
    expect(w1).toContain('data-interactive=\\"truth-table\\"')
    const course = readFileSync(join(out, 'courses/foundations.json'), 'utf8')
    expect(course).toContain('mermaid-src')
  })

  it('gives every exercise a hint and every quiz exactly one correct option', () => {
    let quizzes = 0
    for (const c of ['foundations', 'quant', 'hedgefund']) {
      const weeks = report.courses.find((x) => x.slug === c)!.weeks
      for (let n = 1; n <= weeks; n++) {
        const w = JSON.parse(readFileSync(join(out, `courses/${c}/week-${n}.json`), 'utf8'))
        for (const e of w.exercises) {
          expect(e.hints.length, `${c} ${e.number}`).toBeGreaterThan(0)
          if (!e.quiz) continue
          quizzes++
          const { choices, check } = e.quiz
          expect(choices.options.length).toBeGreaterThanOrEqual(3)
          expect(new Set(choices.options).size).toBe(choices.options.length)
          if (check?.type === 'numeric') {
            const unit = check.unit === '%' ? /\s%$/ : new RegExp(`\\s*${(check.unit || '').replace('.', '\\.')}$`)
            const ok = choices.options.map((o: string) => evaluate(check, o.replace(unit, '').replace(/−/g, '-').replace(/(\d)\.(?=\d{3}\b)/g, '$1')).correct)
            expect(ok.filter(Boolean), `${c} ${e.number}: ${choices.options.join(' | ')}`).toHaveLength(1)
            expect(ok[choices.correct]).toBe(true)
          }
        }
      }
    }
    expect(quizzes).toBeGreaterThanOrEqual(40)
  })

  it('applies the video corrections: Steady cards, removed slots and a reading link', () => {
    const w1 = JSON.parse(readFileSync(join(out, 'courses/foundations/week-1.json'), 'utf8'))
    const steady = w1.videos.flatMap((v: { sources: { access?: string; youtube?: string; url?: string; search?: string }[] }) => v.sources).filter((s: { access?: string }) => s.access === 'steady')
    expect(steady.length).toBe(1)
    expect(steady[0].youtube).toBeUndefined() // the unlisted ID is never shipped
    expect(steady[0].search).toBeUndefined()
    expect(steady[0].url).toMatch(/^https:\/\/thebrightsideofmathematics\.com\/courses\//)
    const titles = w1.videos.flatMap((v: { sources: { title: string }[] }) => v.sources.map((s) => s.title))
    expect(titles.some((t: string) => /1\.4\.[67]/.test(t))).toBe(false)
    const h9 = JSON.parse(readFileSync(join(out, 'courses/hedgefund/week-9.json'), 'utf8'))
    const amaranth = h9.videos.find((v: { key: string }) => v.key === 'H9.5')
    expect(amaranth.sources).toEqual([])
    expect(amaranth.links[0]).toMatch(/senate\.gov/)
    const h2 = JSON.parse(readFileSync(join(out, 'courses/hedgefund/week-2.json'), 'utf8'))
    expect(h2.videos.some((v: { key: string }) => v.key === 'H2.2')).toBe(false)
    // nothing is reported missing any more
    for (const c of report.courses) expect(c.videosMissing, c.slug).toBe(0)
  })

  it('shows sub-questions as lists and strips reviewed forward references', () => {
    const w1 = JSON.parse(readFileSync(join(out, 'courses/foundations/week-1.json'), 'utf8'))
    const e14 = w1.exercises.find((e: { number: string }) => e.number === '1.4')
    expect(e14.prompt).toContain('<ul class="subq">')
    expect(e14.prompt).not.toMatch(/Forsmag/i)
    expect(e14.solution).toContain('<ul class="subq">')
    // no exercise anywhere still points ahead with the reviewed phrases
    for (const c of ['foundations', 'quant', 'hedgefund']) {
      const weeks = report.courses.find((x) => x.slug === c)!.weeks
      for (let n = 1; n <= weeks; n++) {
        const w = JSON.parse(readFileSync(join(out, `courses/${c}/week-${n}.json`), 'utf8'))
        for (const e of w.exercises) expect(`${c} ${e.number}: ${e.prompt}`).not.toMatch(/forsmag på|bruges i uge|se uge \d/i)
      }
    }
  })
})

describe('plan parser validation', () => {
  const plan = (body: string) => `# T\n\n## Uge 1 — Test\n\n> **Læringsmål:** x\n\n### 🧠 Kernebegreber\n\nNoter.\n\n${body}`
  it('fails when an exercise has no solution', () => {
    const p = parsePlan(plan('### ✏️ Øvelser\n\n**1.1** ★ — Opgave.\n\n**1.2** ★★ — Anden.\n\n### ✅ Løsninger\n\n<details>\n<summary>Løsning 1.1</summary>\n\nSvar.\n\n</details>\n'))
    expect(p.errors.map((e) => e.message)).toContain('Øvelse 1.2 har ingen løsning')
  })
  it('fails on a solution without an exercise and on duplicates', () => {
    const sol = (n: string) => `<details>\n<summary>Løsning ${n}</summary>\n\nSvar.\n\n</details>\n`
    const p = parsePlan(plan(`### ✏️ Øvelser\n\n**1.1** ★ — Opgave.\n\n### ✅ Løsninger\n\n${sol('1.1')}\n${sol('1.1')}\n${sol('1.9')}`))
    const msgs = p.errors.map((e) => e.message)
    expect(msgs).toContain('Løsning 1.9 hører ikke til nogen øvelse i uge 1')
    expect(msgs).toContain('Løsning 1.1 findes to gange')
  })
  it('extracts stars, markers and hints', () => {
    const p = parsePlan(plan('### ✏️ Øvelser\n\n**1.1** ★★★ 💻 — Kode.\n\n### ✅ Løsninger\n\n<details>\n<summary>Løsning 1.1</summary>\n\nHint: tænk.\n\nSvaret.\n\n</details>\n'))
    expect(p.errors).toEqual([])
    const e = p.weeks[0].exercises[0]
    expect(e).toMatchObject({ number: '1.1', stars: 3, markers: ['💻'] })
    expect(p.weeks[0].solutions[0]).toMatchObject({ hint: 'tænk.', body: 'Svaret.' })
  })
  it('normalises one-line display math fences', () => {
    expect(normaliseDisplayMath('$$\\begin{aligned}\na &= b\n\\end{aligned}$$')).toBe('$$\n\\begin{aligned}\na &= b\n\\end{aligned}\n$$')
    expect(normaliseDisplayMath('$$x = 1$$')).toBe('$$\nx = 1\n$$')
  })
})
