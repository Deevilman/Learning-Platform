// The course map: every course (written or planned) with a status for this
// learner, grouped by track and ordered so a course comes after the courses
// it builds on. Nothing is ever locked — "Anbefalet senere" is advice.

import type { Attempt } from './storage/types'
import type { CourseData, CourseMeta, PlannedCourse } from '@/types/content'
import { courseComplete, visitId, weekProgress } from './progress'

export type CourseStatus = 'done' | 'started' | 'ready' | 'later' | 'planned'

export interface MapNode {
  slug: string
  title: string
  track: string
  requires: string[]
  recommendedBefore: string[]
  next: string[]
  status: CourseStatus
  /** Prerequisites not finished yet (for "Vi anbefaler at tage X først"). */
  missing: string[]
  depth: number
  planned: boolean
  meta?: CourseMeta
}

export const TRACK_ORDER = ['matematik', 'finans', 'naturvidenskab', 'programmering', 'cyber']

export function courseStarted(d: CourseData, checks: Map<string, boolean>, attempts: Attempt[]): boolean {
  return (
    attempts.some((a) => a.course === d.meta.slug) ||
    d.weeks.some((w) => {
      const p = weekProgress(d, w.number, checks, attempts)
      return p.videosDone + p.exercisesDone + p.checkpointDone > 0 || !!checks.get(visitId(d.meta.slug, w.number))
    })
  )
}

export function buildCourseMap(metas: CourseMeta[], planned: PlannedCourse[], data: Map<string, CourseData>, checks: Map<string, boolean>, attempts: Attempt[], now: number): MapNode[] {
  const done = new Set(metas.filter((m) => data.get(m.slug) && courseComplete(data.get(m.slug)!, checks, attempts, now)).map((m) => m.slug))
  const nodes: MapNode[] = [
    ...metas.map((m) => {
      const d = data.get(m.slug)
      const missing = m.prerequisites.filter((p) => !done.has(p))
      const status: CourseStatus = done.has(m.slug) ? 'done' : d && courseStarted(d, checks, attempts) ? 'started' : missing.length ? 'later' : 'ready'
      return { slug: m.slug, title: m.title, track: m.track || 'andet', requires: m.prerequisites, recommendedBefore: m.recommendedBefore || [], next: m.next, status, missing, depth: 0, planned: false, meta: m }
    }),
    ...planned.map((p) => ({ slug: p.slug, title: p.title, track: p.track || 'andet', requires: p.requires, recommendedBefore: p.recommendedBefore, next: p.next, status: 'planned' as const, missing: p.requires.filter((r) => !done.has(r)), depth: 0, planned: true })),
  ]
  // depth = longest chain of courses before it (requires, recommended_before, and "next" pointing at it)
  const by = new Map(nodes.map((n) => [n.slug, n]))
  const before = new Map<string, string[]>(nodes.map((n) => [n.slug, [...n.requires, ...n.recommendedBefore].filter((s) => by.has(s))]))
  for (const n of nodes) for (const x of n.next) if (by.has(x)) before.get(x)!.push(n.slug)
  const memo = new Map<string, number>()
  const depth = (s: string, seen = new Set<string>()): number => {
    if (memo.has(s)) return memo.get(s)!
    if (seen.has(s)) return 0 // cycles are rejected by the build; be safe anyway
    seen.add(s)
    const d = Math.max(-1, ...before.get(s)!.map((b) => depth(b, seen))) + 1
    memo.set(s, d)
    return d
  }
  for (const n of nodes) n.depth = depth(n.slug)
  return nodes
}

/** Tracks in a fixed order, each with its courses in layers by depth. */
export function groupByTrack(nodes: MapNode[]): { track: string; layers: MapNode[][] }[] {
  const tracks = [...new Set(nodes.map((n) => n.track))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
  return tracks.map((track) => {
    const own = nodes.filter((n) => n.track === track)
    const depths = [...new Set(own.map((n) => n.depth))].sort((a, b) => a - b)
    return { track, layers: depths.map((d) => own.filter((n) => n.depth === d).sort((a, b) => Number(a.planned) - Number(b.planned) || a.title.localeCompare(b.title))) }
  })
}
const rank = (t: string) => (TRACK_ORDER.includes(t) ? TRACK_ORDER.indexOf(t) : TRACK_ORDER.length)
