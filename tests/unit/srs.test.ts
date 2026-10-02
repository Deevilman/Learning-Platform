import { describe, it, expect } from 'vitest'
import { newCard, review, DAY, scoreToRating } from '@/lib/srs'

const NOW = 1_800_000_000_000

describe('spaced repetition scheduler', () => {
  it('grows intervals 2 → 4 → ~10 days for "Kunne med hint"', () => {
    let c = newCard('x', NOW)
    c = review(c, 2, NOW)
    expect(c.interval).toBe(2)
    c = review(c, 2, NOW + 2 * DAY)
    expect(c.interval).toBe(4)
    c = review(c, 2, NOW + 6 * DAY)
    expect(c.interval).toBe(10)
    expect(c.due).toBe(NOW + 6 * DAY + 10 * DAY)
  })
  it('resets on a lapse and lowers ease, but never below 1.3', () => {
    let c = newCard('x', NOW)
    for (let i = 0; i < 4; i++) c = review(c, 3, NOW + i * DAY)
    const before = c.interval
    c = review(c, 0, NOW + 100 * DAY)
    expect(c.interval).toBe(1)
    expect(c.lapses).toBe(1)
    expect(c.interval).toBeLessThan(before)
    for (let i = 0; i < 20; i++) c = review(c, 0, NOW)
    expect(c.ease).toBeGreaterThanOrEqual(1.3)
  })
  it('makes "Kunne" grow faster than "Delvist"', () => {
    let a = newCard('a', NOW)
    let b = newCard('b', NOW)
    for (let i = 0; i < 4; i++) {
      a = review(a, 3, NOW)
      b = review(b, 1, NOW)
    }
    expect(a.interval).toBeGreaterThan(b.interval)
  })
  it('maps auto-check scores to ratings', () => {
    expect([0, 0.33, 0.66, 1].map(scoreToRating)).toEqual([0, 1, 2, 3])
  })
})
