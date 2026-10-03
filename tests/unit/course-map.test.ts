import { describe, expect, it } from 'vitest'
import { buildCourseMap, groupByTrack } from '@/lib/course-map'
import type { CourseData, CourseMeta } from '@/types/content'

const meta = (slug: string, o: Partial<CourseMeta> = {}): CourseMeta =>
  ({ slug, title: slug, short: '', color: '#000', icon: '', level: '', estimated_weeks: 1, prerequisites: [], recommendedBefore: [], next: [], lang: 'da', topics: [], track: 'matematik', ...o }) as CourseMeta
const course = (m: CourseMeta): CourseData => ({ meta: m, titleHtml: '', weeks: [{ number: 1, title: 'U1', videoCount: 1, exerciseCount: 0, checkpointCount: 1, videos: [{ id: '1.1' }] } as never], info: [], sets: [], glossary: [], counts: { weeks: 1, exercises: 0, solutions: 0, videos: 1, videosMissing: 0 }, tryIt: [] })

describe('course map', () => {
  const a = meta('a', { next: ['b'] })
  const b = meta('b', { prerequisites: ['a'] })
  const c = meta('c')
  const data = new Map([a, b, c].map((m) => [m.slug, course(m)]))
  const planned = [{ slug: 'p', title: 'P', track: 'cyber', requires: ['b'], recommendedBefore: [], next: [] }]
  it('gives each course a status for the learner — never locked', () => {
    const fresh = buildCourseMap([a, b, c], planned, data, new Map(), [], 0)
    expect(Object.fromEntries(fresh.map((n) => [n.slug, n.status]))).toEqual({ a: 'ready', b: 'later', c: 'ready', p: 'planned' })
    expect(fresh.find((n) => n.slug === 'b')!.missing).toEqual(['a'])
    // a finished (video + checkpoint ticked), c started
    const checks = new Map([
      ['video:a/1.1', true],
      ['checkpoint:a/1/0', true],
      ['video:c/1.1', true],
    ])
    const later = buildCourseMap([a, b, c], planned, data, checks, [], 0)
    expect(Object.fromEntries(later.map((n) => [n.slug, n.status]))).toEqual({ a: 'done', b: 'ready', c: 'started', p: 'planned' })
  })
  it('groups by track in a fixed order, in layers by what comes first', () => {
    const groups = groupByTrack(buildCourseMap([a, b, c], planned, data, new Map(), [], 0))
    expect(groups.map((g) => g.track)).toEqual(['matematik', 'cyber'])
    expect(groups[0].layers.map((l) => l.map((n) => n.slug))).toEqual([['a', 'c'], ['b']])
    expect(groups[1].layers[0][0].depth).toBe(2)
  })
})
