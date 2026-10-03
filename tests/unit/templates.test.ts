import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yaml'
import { checkTemplateShape, generateFromTemplate, interpolate, templateToGenerator, validateTemplate, type TemplateDef } from '@/lib/templates'
import { evaluate } from '@/lib/check'

const FIXTURE = readFileSync(join(import.meta.dirname, '../fixtures/testkursus.md'), 'utf8')
const fixtureTemplate = () => YAML.parse(/```opgaveskabelon\n([\s\S]*?)\n```/.exec(FIXTURE)![1]) as TemplateDef

const moles: TemplateDef = {
  id: 'test/stofmaengde',
  emner: ['kemi'],
  svaerhed: [1, 2],
  type: 'tal',
  variabler: {
    stof: { vaelg: ['H_2O', 'CO_2', 'NaCl'] },
    M: { vaelg: [18.02, 44.01, 58.44], vaelg_par_med: 'stof' },
    m: { interval: [1, 100], decimaler: 1, ikke: [50] },
  },
  beregn: { n: 'm / M' },
  betingelser: ['n > 0.05'],
  opgave: 'Hvor mange mol er der i {m} g $\\ce{{stof}}$?',
  svar: { udtryk: 'n', tolerance: '1%', enhed: 'mol', decimaler: 3 },
  hints: ['Brug $n = m/M$.', 'Molmassen er {M} g/mol.'],
  loesning: '$n = {m} / {M} = {n:.3f}$ mol',
  distraktorer: [{ udtryk: 'm * M', forklaring: 'Du har ganget i stedet for at dividere.' }],
}

describe('exercise templates', () => {
  it('the fixture template passes 200 seeds', () => {
    expect(validateTemplate(fixtureTemplate()).errors).toEqual([])
  })

  it('is deterministic and keeps paired choices together', () => {
    const a = generateFromTemplate(moles, 42, 1)
    expect(generateFromTemplate(moles, 42, 1)).toEqual(a)
    for (let s = 1; s < 50; s++) {
      const { strs, nums } = generateFromTemplate(moles, s, 1).values
      expect(nums.M).toBe({ H_2O: 18.02, CO_2: 44.01, NaCl: 58.44 }[strs.stof])
      expect(nums.m).not.toBe(50)
      expect(nums.n).toBeGreaterThan(0.05)
    }
    expect(a.prompt).toMatch(/\\ce\{(H_2O|CO_2|NaCl)\}/)
    expect(a.moreHints![0]).toMatch(/Molmassen er \d+\.\d+ g\/mol/)
    expect(validateTemplate(moles).errors).toEqual([])
  })

  it('makes numeric checks with relative tolerance and units', () => {
    const ex = generateFromTemplate(moles, 7, 1)
    expect(ex.check).toMatchObject({ type: 'numeric', relative: true, tolerance: 0.01, unit: 'mol' })
    const ans = (ex.check as { answer: number }).answer
    expect(evaluate(ex.check, String(ans * 1.005)).correct).toBe(true)
    expect(evaluate(ex.check, String(ans * 1.05)).correct).toBe(false)
  })

  it('multiple choice explains the wrong options', () => {
    const def: TemplateDef = {
      id: 'test/mc',
      emner: ['x'],
      svaerhed: 1,
      type: 'multiple-choice',
      variabler: { a: { interval: [2, 9] }, b: { interval: [2, 9] } },
      betingelser: ['a != b'],
      opgave: 'Hvad er ${a} \\cdot {b}$?',
      svar: { udtryk: 'a * b' },
      hints: ['Gang.'],
      loesning: '${a} \\cdot {b} = {p}$',
      beregn: { p: 'a * b' },
      distraktorer: [
        { udtryk: 'a + b', forklaring: 'Du har lagt sammen.' },
        { udtryk: 'a * b + 1', forklaring: 'Et for meget.' },
        { udtryk: 'a * b - 1', forklaring: 'Et for lidt.' },
      ],
    }
    expect(validateTemplate(def).errors).toEqual([])
    const ex = generateFromTemplate(def, 3, 1)
    const c = ex.check as { options: string[]; correct: number; explanations: string[] }
    expect(c.options).toHaveLength(4)
    const wrong = c.explanations.findIndex((x) => x === 'Du har lagt sammen.')
    expect(evaluate(ex.check, String(wrong)).message).toMatch(/Du har lagt sammen/)
    expect(evaluate(ex.check, String(c.correct)).correct).toBe(true)
  })

  it('text and expression answers', () => {
    const text: TemplateDef = {
      id: 'test/tekst',
      emner: ['x'],
      svaerhed: 1,
      type: 'tekst',
      variabler: { a: { interval: [1, 3] } },
      beregn: { b: 'a + 1', c: 'a + 2' },
      opgave: 'Skriv mængden af tallene fra {a} til {c}.',
      svar: { tekst: '{{a}, {b}, {c}}', maengde: true },
      hints: ['Tre tal.'],
      loesning: 'Svaret er {{a}, {b}, {c}}.',
    }
    expect(validateTemplate(text).errors).toEqual([])
    const ex = generateFromTemplate(text, 1, 1)
    const { a } = ex.values.nums
    expect(evaluate(ex.check, `{${a + 2}, ${a}, ${a + 1}}`).correct).toBe(true)

    const expr: TemplateDef = {
      id: 'test/udtryk',
      emner: ['x'],
      svaerhed: 1,
      type: 'udtryk',
      variabler: { k: { interval: [2, 5] } },
      opgave: 'Differentiér $f(x) = {k}x^2$.',
      svar: { udtryk: '2*{k}*x', variabler: ['x'] },
      hints: ['Potensreglen.'],
      loesning: "$f'(x) = 2 \\cdot {k} x$",
    }
    expect(validateTemplate(expr).errors).toEqual([])
    const e = generateFromTemplate(expr, 1, 1)
    const k = e.values.nums.k
    expect(evaluate(e.check, `${2 * k}x`.replace('x', '*x')).correct).toBe(true)
    expect(evaluate(e.check, `x*${k}+x*${k}`).correct).toBe(true)
    expect(evaluate(e.check, `${k}*x^2`).correct).toBe(false)
    expect(evaluate(e.check, `2*y`).message).toMatch(/Brug kun x/)
  })

  it('validation catches the classic template mistakes', () => {
    const base = fixtureTemplate()
    const bad = (patch: Partial<TemplateDef>) => validateTemplate({ ...base, ...patch }).errors.join('\n')
    expect(bad({ beregn: { s: 'a / (b - b)' } })).toMatch(/Infinity|NaN/)
    expect(bad({ loesning: 'Læg dem sammen.' })).toMatch(/nævner ikke svaret/)
    expect(bad({ distraktorer: [{ udtryk: 'b + a' }] })).toMatch(/distraktor er lig med svaret/)
    expect(bad({ betingelser: ['a > 100'] })).toMatch(/Betingelserne kunne ikke opfyldes/)
    expect(bad({ svar: { udtryk: 's +' } })).toMatch(/ufuldstændigt/)
    expect(bad({ type: 'kode' })).toMatch(/problem/)
    expect(checkTemplateShape({ ...base, hints: [] })).toEqual([expect.stringMatching(/mindst ét hint/)])
    expect(checkTemplateShape({ ...base, foo: 1 })).toEqual(['Ukendt felt "foo".'])
    expect(checkTemplateShape({ ...base, variabler: { a: { vaelg: [1], vaelg_par_med: 'zz' } } })).toEqual([expect.stringMatching(/længere oppe/)])
  })

  it('interpolates only known names, so LaTeX braces survive', () => {
    expect(interpolate('\\frac{a}{2} = {a} {x:.2f}', { nums: { a: 3, x: 1 / 3 }, strs: {} })).toBe('\\frac{3}{2} = 3 0.33')
    expect(interpolate('\\text{b}', { nums: {}, strs: {} })).toBe('\\text{b}')
  })

  it('becomes an ordinary generator', () => {
    const g = templateToGenerator(fixtureTemplate(), 'testkursus')
    expect(g).toMatchObject({ id: 'testkursus/addition', course: 'testkursus', topics: ['udsagn'], difficulties: [1] })
    const ex = g.generate(5, 1)
    expect(ex).not.toHaveProperty('values')
    expect(evaluate(ex.check, String((ex.check as { answer: number }).answer)).correct).toBe(true)
  })
})
