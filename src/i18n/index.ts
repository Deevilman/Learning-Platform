// UI text in Danish and English. Keys live in da.json and en.json (a test
// checks that both have the same keys and placeholders). Course content is
// never machine-translated: a course can have its own version per language.

import { useEffect } from 'react'
import { useSetting } from '@/lib/store'
import { browserLang, dateLocale, LANGS, setCurrentLang, translate, type Key, type Lang } from './translate'

export { LANGS, translate, browserLang, dateLocale, type Key, type Lang }

export const LANG_KEY = 'lang'

/** The chosen language (synced like other settings; default: the browser's) and a setter. */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useSetting<Lang | null>(LANG_KEY, null)
  return [lang && LANGS.includes(lang) ? lang : browserLang(), setLang]
}

export type T = (key: Key, vars?: Record<string, string | number>) => string

/** t('nav.courses') in the chosen language. */
export function useT(): T {
  const [lang] = useLang()
  return (key, vars) => translate(lang, key, vars)
}

/** Keeps <html lang> and the course language in step with the chosen language. */
export function LangApplier() {
  const [lang] = useLang()
  setCurrentLang(lang)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return null
}

/** Whether a course can be read in a language (its main language or a version). */
export const hasLang = (meta: { lang: Lang; langs?: Lang[] }, lang: Lang) => (meta.langs || [meta.lang]).includes(lang)
