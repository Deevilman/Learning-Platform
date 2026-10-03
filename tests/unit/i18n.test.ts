import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import da from '@/i18n/da.json'
import en from '@/i18n/en.json'
import { coursesForLang, translate } from '@/i18n'

const SRC = join(import.meta.dirname, '../../src')
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : /\.tsx?$/.test(f) ? [join(dir, f)] : []))
const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('UI text in Danish and English', () => {
  it('both languages have the same keys and placeholders, none empty', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(da).sort())
    for (const k of Object.keys(da) as (keyof typeof da)[]) {
      expect(vars(en[k]), k).toEqual(vars(da[k]))
      expect(da[k].trim() && en[k].trim(), k).toBeTruthy()
    }
  })
  it('every key used in the code exists', () => {
    const used = new Set<string>()
    for (const f of files(SRC)) for (const m of readFileSync(f, 'utf8').matchAll(/\bt\('([\w.]+)'/g)) used.add(m[1])
    expect(used.size).toBeGreaterThan(40)
    const missing = [...used].filter((k) => !(k in da))
    expect(missing).toEqual([])
  })
  it('fills in placeholders', () => {
    expect(translate('en', 'week.of', { n: 2, total: 12 })).toBe('Week 2 of 12')
    expect(translate('da', 'week.of', { n: 2, total: 12 })).toBe('Uge 2 af 12')
  })
})

describe('course versions per language', () => {
  const c = (slug: string, lang: 'da' | 'en', translationOf?: string) => ({ meta: { slug, lang, translationOf } })
  const all = [c('quant', 'da'), c('quant-en', 'en', 'quant'), c('kemi', 'da'), c('python', 'en')]
  it('shows the version in the chosen language, and other courses as written', () => {
    expect(coursesForLang(all, 'en').map((x) => x.meta.slug)).toEqual(['quant-en', 'kemi', 'python'])
    expect(coursesForLang(all, 'da').map((x) => x.meta.slug)).toEqual(['quant', 'kemi', 'python'])
  })
})
