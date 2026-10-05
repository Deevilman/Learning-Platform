import { describe, expect, it } from 'vitest'
import { courseMastery, nextItem, unitSummaries } from '@/lib/course-overview'
import type { Attempt } from '@/lib/storage/types'
import type { CourseData } from '@/types/content'

const course = {
  meta: { slug: 'k', topics: [{ id: 'a', name: 'A', weeks: [1] }, { id: 'b', name: 'B', weeks: [2] }] },
  weeks: [
    { number: 1, title: 'Uge et', videoCount: 2, videos: [{ id: '1.1' }, { id: '1.2' }], exerciseCount: 4, checkpointCount: 2, topics: ['a'] },
    { number: 2, title: 'Uge to', videoCount: 1, videos: [{ id: '2.1' }], exerciseCount: 0, checkpointCount: 0, topics: ['b'] },
  ],
} as unknown as CourseData

const attempt = (id: string, week: number, score: number, ts: number, topics = ['a']): Attempt => ({ id, exerciseId: id, course: 'k', week, topics, difficulty: 2, score, source: 'bank', ts, updatedAt: ts })

describe('course overview', () => {
  it('lists every page of a week with how much of it is done', () => {
    const checks = new Map([['video:k/1.1', true], ['checkpoint:k/1/0', true]])
    const [u1, u2] = unitSummaries(course, checks, [attempt('k/1/1.1', 1, 1, 1)], new Map([['lesson:k/1', { done: true }]]))
    expect(u1.items.map((i) => [i.page, i.done])).toEqual([['video-1.1', 1], ['video-1.2', 0], ['laes', 1], ['oev', 0.25], ['checkpoint', 0.5]])
    expect(u1.progress).toBeCloseTo((1 + 0 + 1 + 0.25 + 0.5) / 5)
    expect(u1).toMatchObject({ started: true, done: false })
    expect(nextItem(u1).page).toBe('video-1.2')
    // no exercises, no checkpoint: just the video and the reading
    expect(u2.items.map((i) => i.page)).toEqual(['video-2.1', 'laes'])
    expect(u2).toMatchObject({ started: false, done: false })
    expect(nextItem(u2).page).toBe('video-2.1')
  })

  it('course mastery: points per topic level, 0 % before you start', () => {
    const now = 10 * 86_400_000
    expect(courseMastery(course, [], now)).toMatchObject({ percent: 0, counts: { 'ikke-startet': 2 } })
    const many = Array.from({ length: 8 }, (_, i) => attempt(`k/1/${i}`, 1, 1, now - i))
    const m = courseMastery(course, many, now)
    expect(m.counts).toMatchObject({ mestret: 1, 'ikke-startet': 1 })
    expect(m.percent).toBe(50)
  })
})
