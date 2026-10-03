// Spaced repetition: a small SM-2 variant.
//
// The learner rates each bank exercise on four levels. They map to SM-2
// quality grades: Kunne ikke → 1, Delvist → 3, Kunne med hint → 4, Kunne → 5.
// A grade below 3 is a lapse: the card restarts with a 1-day interval and its
// ease drops. Otherwise the interval grows 1 → 3 → interval × ease, where
// "Delvist" grows it more slowly (× 1.2) and "Kunne" adds a small bonus.

import type { Rating, SrsRec } from './storage/types'

export const DAY = 24 * 60 * 60 * 1000
const MIN_EASE = 1.3
const QUALITY: Record<Rating, number> = { 0: 1, 1: 3, 2: 4, 3: 5 }

export function newCard(id: string, now: number): SrsRec {
  return { id, due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0, last: 0, updatedAt: now }
}

export function review(card: SrsRec, rating: Rating, now: number): SrsRec {
  const q = QUALITY[rating]
  let { interval, ease, reps, lapses } = card
  ease = Math.max(MIN_EASE, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
  if (q < 3) {
    reps = 0
    lapses += 1
    interval = 1
  } else {
    reps += 1
    if (reps === 1) interval = q === 3 ? 1 : 2
    else if (reps === 2) interval = q === 3 ? 2 : 4
    else interval = Math.round(interval * (q === 3 ? 1.2 : ease) * (q === 5 ? 1.15 : 1))
    interval = Math.min(Math.max(interval, 1), 365)
  }
  return { ...card, interval, ease, reps, lapses, last: now, due: now + interval * DAY, updatedAt: now }
}

export const isDue = (card: SrsRec, now: number) => card.due <= now

/** Convert a 0..1 score (e.g. from an auto-check) into a rating. */
export function scoreToRating(score: number): Rating {
  if (score >= 0.95) return 3
  if (score >= 0.6) return 2
  if (score >= 0.3) return 1
  return 0
}

export const RATING_SCORE: Record<Rating, number> = { 0: 0, 1: 0.33, 2: 0.66, 3: 1 }
/** i18n keys for the self ratings. */
export const RATING_LABEL = { 0: 'rating.0', 1: 'rating.1', 2: 'rating.2', 3: 'rating.3' } as const satisfies Record<Rating, string>
