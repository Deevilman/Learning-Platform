// Flashcards: which cards to show now (due first, then a few new ones a day)
// and checking a typed answer. Scheduling is the same SM-2 as for exercises
// (srs table, id "fc:…").

import type { Flashcard } from '@/types/content'
import type { SrsRec } from './storage/types'

export const NEW_PER_SESSION = 10

/** Due cards (most overdue first), then up to `newLimit` cards never seen. Typed mode skips cards without a plain answer. */
export function flashcardSession(cards: Flashcard[], srs: Map<string, SrsRec>, now: number, mode: 'flip' | 'type', newLimit = NEW_PER_SESSION): Flashcard[] {
  const usable = mode === 'type' ? cards.filter((c) => c.answer) : cards
  const due = usable.filter((c) => srs.get(c.id) && srs.get(c.id)!.due <= now).sort((a, b) => srs.get(a.id)!.due - srs.get(b.id)!.due)
  const fresh = usable.filter((c) => !srs.has(c.id)).sort((a, b) => (a.week ?? 99) - (b.week ?? 99)).slice(0, newLimit)
  return [...due, ...fresh]
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

/** Edit distance, for forgiving a small typo in a long word. */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

/** "exact", "close" (one typo in a word of 6+ letters) or "wrong". Alternatives: "a / b", "a, b". */
export function checkTyped(card: Flashcard, typed: string): 'exact' | 'close' | 'wrong' {
  if (!card.answer) return 'wrong'
  const got = norm(typed)
  if (!got) return 'wrong'
  const options = card.answer.split(/\s*[/,;]\s*/).map(norm).filter(Boolean)
  if (options.includes(got) || norm(card.answer) === got) return 'exact'
  if (options.some((o) => o.length >= 6 && distance(o, got) <= 1)) return 'close'
  return 'wrong'
}
