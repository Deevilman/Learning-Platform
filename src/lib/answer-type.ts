// "Opgavetype" setting: Blandet · Kun multiple choice · Kun skriv selv.
// Decides how an exercise is answered and which exercises a list shows.

export type AnswerPref = 'blandet' | 'mc' | 'skriv'
export const ANSWER_PREF_KEY = 'answerType'
export const ANSWER_PREF_LABEL = { blandet: 'pref.mixed', mc: 'pref.mc', skriv: 'pref.typed' } as const satisfies Record<AnswerPref, string>

export interface AnswerCapabilities {
  /** Can be answered by picking one of several options. */
  choices: boolean
  /** Can be answered by writing (a number, a word, or a free answer you rate yourself). */
  typed: boolean
}

/** Does an exercise belong in a list filtered by this preference? */
export function matchesAnswerPref(c: AnswerCapabilities, pref: AnswerPref): boolean {
  if (pref === 'mc') return c.choices
  if (pref === 'skriv') return c.typed
  return c.choices || c.typed
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** How this exercise is answered right now. "Blandet" alternates per exercise (stable for the same exercise). */
export function answerFormat(c: AnswerCapabilities, pref: AnswerPref, key: string): 'mc' | 'typed' {
  if (!c.choices) return 'typed'
  if (!c.typed) return 'mc'
  if (pref === 'mc') return 'mc'
  if (pref === 'skriv') return 'typed'
  return hash(key) % 2 === 0 ? 'mc' : 'typed'
}

/** Filter a list and say how many were hidden, so the page can tell the learner. */
export function filterByAnswerPref<T>(items: T[], caps: (t: T) => AnswerCapabilities, pref: AnswerPref): { shown: T[]; hidden: number } {
  const shown = items.filter((t) => matchesAnswerPref(caps(t), pref))
  return { shown, hidden: items.length - shown.length }
}
