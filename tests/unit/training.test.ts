import { describe, it, expect } from 'vitest'
import { TrainingSession } from '@/lib/training'
import { generators } from '@/lib/generators'
import { mulberry32 } from '@/lib/rng'
import type { ExerciseSummary } from '@/types/content'
import type { SrsRec } from '@/lib/storage/types'

const NOW = 1_800_000_000_000
const bank = (n: number): ExerciseSummary[] =>
  Array.from({ length: n }, (_, i) => ({ id: `quant/3/3.${i + 1}`, course: 'quant', week: 3, number: `3.${i + 1}`, topics: ['probability'], difficulty: ((i % 3) + 1) as 1 | 2 | 3, kind: 'compute', hasHint: false, hasCheck: false, set: 'week', title: '' }))

describe('training session', () => {
  it('runs 150 items without repeating a generated exercise', () => {
    const s = new TrainingSession({ bank: bank(10), srs: new Map(), attempted: new Set(), generators: generators.filter((g) => g.course === 'quant'), now: NOW, random: mulberry32(42) })
    const seen = new Set<string>()
    let generated = 0
    for (let i = 0; i < 150; i++) {
      const it = s.next()
      expect(it).not.toBeNull()
      if (it!.kind === 'generated') {
        generated++
        const key = `${it!.generatorId}|${it!.exercise.prompt}`
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      }
      s.record(i % 4 === 0 ? 0 : 1)
    }
    expect(generated).toBeGreaterThan(100)
  })

  it('serves due bank exercises before they are forgotten', () => {
    const b = bank(5)
    const srs = new Map<string, SrsRec>([[b[2].id, { id: b[2].id, due: NOW - 1000, interval: 3, ease: 2.5, reps: 2, lapses: 0, last: NOW - 3 * 86400000, updatedAt: 0 }]])
    const s = new TrainingSession({ bank: b, srs, attempted: new Set(b.map((x) => x.id)), generators: [], now: NOW, random: mulberry32(1) })
    expect(s.next()).toMatchObject({ kind: 'bank', exerciseId: b[2].id, reason: 'due' })
  })

  it('raises difficulty after 3 correct and lowers it after 2 mistakes', () => {
    const s = new TrainingSession({ bank: [], srs: new Map(), attempted: new Set(), generators, now: NOW, startDifficulty: 1 })
    s.record(1)
    s.record(1)
    expect(s.level).toBe(1)
    s.record(1)
    expect(s.level).toBe(2)
    s.record(0)
    expect(s.level).toBe(2)
    s.record(0)
    expect(s.level).toBe(1)
  })

  it('never runs out: without generators it cycles through the bank', () => {
    const s = new TrainingSession({ bank: bank(3), srs: new Map(), attempted: new Set(), generators: [], now: NOW, random: mulberry32(7) })
    for (let i = 0; i < 20; i++) expect(s.next()).not.toBeNull()
  })
})
