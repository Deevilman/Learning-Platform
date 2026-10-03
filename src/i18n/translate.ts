// Plain lookup of UI text (no React), usable from lib code.

import da from './da.json'
import en from './en.json'

export type Lang = 'da' | 'en'
export type Key = keyof typeof da
export const LANGS: Lang[] = ['da', 'en']
const DICTS: Record<Lang, Record<string, string>> = { da, en }

export function translate(lang: Lang, key: Key, vars: Record<string, string | number> = {}): string {
  const s = DICTS[lang][key] ?? DICTS.da[key] ?? key
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}

/** Danish if the browser prefers Danish (or Norwegian/Swedish), otherwise English. */
export function browserLang(): Lang {
  const prefs = typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const p of prefs) {
    const l = String(p).toLowerCase()
    if (/^(da|nb|nn|no|sv)\b/.test(l)) return 'da'
    if (/^en\b/.test(l)) return 'en'
  }
  return 'da'
}

// The language chosen in the app, for lib code that runs outside React (set by <LangApplier>).
let current: Lang = 'da'
export const setCurrentLang = (l: Lang) => void (current = l)
export const currentLang = () => current
/** translate() in the app's current language. */
export const tr = (key: Key, vars?: Record<string, string | number>) => translate(current, key, vars)
/** Locale for dates in the current language. */
export const dateLocale = (l: Lang = current) => (l === 'da' ? 'da-DK' : 'en-GB')
