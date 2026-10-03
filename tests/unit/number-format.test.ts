import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { convertNumbers, danishNumbers } from '../../scripts/lib/number-format'

describe('Danish → US number format in course text', () => {
  it('converts the certain cases and leaves code, links and course codes alone', () => {
    const r = convertNumbers('Pris 99,95 kr., 1.000 kr., 1.234.567 aktier, 1.234,5 og 0,05 %. $x = 0{,}25 + 1.000.000 + 14.802{,}44$. `a = 1,5` https://x.dk/1,5 MIT 18.404J, Øvelse 1.2.')
    expect(r.text).toBe('Pris 99.95 kr., 1,000 kr., 1,234,567 aktier, 1,234.5 og 0.05 %. $x = 0.25 + 1000000 + 14802.44$. `a = 1,5` https://x.dk/1,5 MIT 18.404J, Øvelse 1.2.')
    expect(r.review).toEqual([])
  })
  it('lists the unclear cases with line numbers instead of guessing', () => {
    const r = convertNumbers('Linje 1\nN(0,1), 2,500 og 1,2,3 og e = 2.718.\n$0,5$')
    expect(r.review.map((x) => [x.line, x.text])).toEqual([
      [2, '1,2,3'],
      [2, '0,1'],
      [2, '2,500'],
      [2, '2.718'],
      [3, '0,5'],
    ])
    expect(r.text).toContain('N(0,1), 2,500 og 1,2,3 og e = 2.718.')
  })
  it('in US text only certain Danish forms are reported', () => {
    expect(danishNumbers('1,000 kr. og 2.718 og (0,1) og 1,234,567')).toEqual([])
    expect(danishNumbers('Svaret er 0,25.').map((x) => x.line)).toEqual([1])
  })
  it('the course files are converted (no {,} left)', () => {
    for (const c of ['foundations', 'quant', 'hedgefund']) expect(readFileSync(join(import.meta.dirname, `../../content/courses/${c}.md`), 'utf8')).not.toContain('{,}')
  })
})
