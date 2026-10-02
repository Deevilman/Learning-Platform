import { describe, it, expect } from 'vitest'
import { computeMastery } from '@/lib/mastery'
import { DAY } from '@/lib/srs'

const NOW = 1_800_000_000_000
const at = (daysAgo: number, score: number, difficulty: 1 | 2 | 3 = 2) => ({ score, difficulty, ts: NOW - daysAgo * DAY })

describe('mastery model', () => {
  it('is 0 with no attempts and has zero confidence', () => {
    expect(computeMastery([], NOW)).toMatchObject({ mastery: 0, confidence: 0, attempts: 0 })
  })
  it('approaches 1 with repeated correct answers', () => {
    const m = computeMastery(Array.from({ length: 12 }, () => at(0, 1)).map((a, i) => ({ ...a, ts: NOW - (12 - i) * 1000 })), NOW)
    expect(m.mastery).toBeGreaterThan(0.95)
    expect(m.confidence).toBeGreaterThan(0.9)
  })
  it('weights recent attempts more than old ones', () => {
    const goodThenBad = computeMastery([at(5, 1), at(4, 1), at(3, 1), at(2, 0), at(1, 0)], NOW)
    const badThenGood = computeMastery([at(5, 0), at(4, 0), at(3, 1), at(2, 1), at(1, 1)], NOW)
    expect(badThenGood.mastery).toBeGreaterThan(goodThenBad.mastery)
  })
  it('lets harder exercises move the estimate more', () => {
    const easy = computeMastery([at(0, 1, 1)], NOW)
    const hard = computeMastery([at(0, 1, 3)], NOW)
    expect(hard.mastery).toBeGreaterThan(easy.mastery)
  })
  it('forgets over time, more slowly with more practice', () => {
    const fresh = computeMastery([at(0, 1), at(0, 1)], NOW)
    const old = computeMastery([at(30, 1), at(30, 1)], NOW)
    expect(old.mastery).toBeLessThan(fresh.mastery)
    expect(old.raw).toBeCloseTo(fresh.raw)
    const practiced = computeMastery(Array.from({ length: 10 }, () => at(30, 1)), NOW)
    const ratioFew = old.mastery / old.raw
    const ratioMany = practiced.mastery / practiced.raw
    expect(ratioMany).toBeGreaterThan(ratioFew)
  })
  it('tracks per-difficulty averages and recent scores', () => {
    const m = computeMastery([at(3, 0, 2), at(2, 0.33, 2), at(1, 1, 1)], NOW)
    expect(m.byDifficulty[2].n).toBe(2)
    expect(m.byDifficulty[2].avg).toBeCloseTo(0.165)
    expect(m.recent).toEqual([0, 0.33, 1])
  })
})

import { masteryLevel } from '@/lib/mastery'
describe('mastery levels', () => {
  it('goes Ikke startet → Øvet → Kendt → Mestret', () => {
    expect(masteryLevel({ mastery: 0, confidence: 0, attempts: 0 })).toBe('ikke-startet')
    expect(masteryLevel({ mastery: 0.3, confidence: 0.2, attempts: 1 })).toBe('oevet')
    expect(masteryLevel({ mastery: 0.6, confidence: 0.4, attempts: 2 })).toBe('kendt')
    expect(masteryLevel({ mastery: 0.9, confidence: 0.3, attempts: 1 })).toBe('kendt') // too little evidence
    expect(masteryLevel({ mastery: 0.9, confidence: 0.6, attempts: 4 })).toBe('mestret')
  })
})
