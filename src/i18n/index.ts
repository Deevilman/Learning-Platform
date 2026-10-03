// UI text in Danish and English. Keys live in da.json and en.json (a test
// checks that both have the same keys and placeholders). Course content is
// never machine-translated: a course has its own version per language.

import { useEffect } from 'react'
import da from './da.json'
import en from './en.json'
import { useSetting } from '@/lib/store'
import type { CourseMeta } from '@/types/content'

export type Lang = 'da' | 'en'
export type Key = keyof typeof da
export const LANGS: Lang[] = ['da', 'en']
const DICTS: Record<Lang, Record<string, string>> = { da, en }

export function translate(lang: Lang, key: Key, vars: Record<string, string | number> = {}): string {
  const s = DICTS[lang][key] ?? DICTS.da[key] ?? key
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}

export const LANG_KEY = 'lang'

/** The chosen language (default Danish) and a setter. */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useSetting<Lang>(LANG_KEY, 'da')
  return [LANGS.includes(lang) ? lang : 'da', setLang]
}

/** t('nav.courses') in the chosen language. */
export function useT() {
  const [lang] = useLang()
  return (key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars)
}

/** Keeps <html lang> in step with the chosen language. */
export function LangApplier() {
  const [lang] = useLang()
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return null
}

/**
 * The courses to show in a language: a course with a version in that language
 * ("translation_of") is shown in that version only; others as written.
 */
export function coursesForLang<T extends { meta: Pick<CourseMeta, 'slug' | 'lang' | 'translationOf'> }>(courses: T[], lang: Lang): T[] {
  const root = (c: T) => c.meta.translationOf || c.meta.slug
  const groups = new Map<string, T[]>()
  for (const c of courses) groups.set(root(c), [...(groups.get(root(c)) || []), c])
  return courses.filter((c) => {
    const g = groups.get(root(c))!
    const pick = g.find((x) => x.meta.lang === lang) || g.find((x) => !x.meta.translationOf) || g[0]
    return pick === c
  })
}
