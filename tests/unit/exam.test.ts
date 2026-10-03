import { describe, expect, it } from 'vitest'
import { buildExam, EXAM_LENGTHS, gradeEstimate, topicsToTrain } from '@/lib/exam'
import type { WeekPool } from '@/lib/placement'

const pools: WeekPool[] = [1, 2, 3, 4].map((w) => ({
  week: w,
  quizzes: [{ exerciseId: `q${w}a`, difficulty: 1 }, { exerciseId: `q${w}b`, difficulty: 3 }],
  generators: [{ id: `g${w}`, difficulties: [1, 2, 3] }],
}))

describe('practice exam', () => {
  it('two parts: easier without aids, harder with aids, covering every week, no repeats', () => {
    const [p1, p2] = buildExam(pools, 7, EXAM_LENGTHS[1])
    expect(p1).toMatchObject({ aids: false, minutes: 60 })
    expect(p2).toMatchObject({ aids: true, minutes: 240 })
    expect(p1.questions).toHaveLength(10)
    expect(p1.questions.every((q) => q.difficulty <= 2)).toBe(true)
    expect(p2.questions.every((q) => q.difficulty >= 2)).toBe(true)
    expect(new Set(p1.questions.map((q) => q.week))).toEqual(new Set([1, 2, 3, 4]))
    const keys = [...p1.questions, ...p2.questions].map((q) => JSON.stringify(q))
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('a grade estimate on the 7-point scale', () => {
    expect([1, 0.8, 0.65, 0.5, 0.35, 0.15, 0].map(gradeEstimate)).toEqual(['12', '10', '7', '4', '02', '00', '-3'])
  })
  it('topics to train: most points lost first', () => {
    expect(topicsToTrain([{ topics: ['a'], points: 0, max: 1 }, { topics: ['a', 'b'], points: 0, max: 1 }, { topics: ['c'], points: 1, max: 1 }])).toEqual(['a', 'b'])
  })
})
