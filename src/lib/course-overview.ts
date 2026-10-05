// The course page overview (Khan Academy style): for each week ("enhed") the
// pages in it with what is done, how far the week is, and the course's
// overall mastery from the topic mastery levels.

import type { Attempt } from './storage/types'
import type { CourseData } from '@/types/content'
import { checkpointId, videoWatched } from './progress'
import { computeMastery, masteryLevel, MASTERY_LEVELS, type MasteryLevel } from './mastery'

export type UnitItemKind = 'video' | 'laes' | 'oev' | 'checkpoint'

export interface UnitItem {
  kind: UnitItemKind
  /** The week page's ?fane= id. */
  page: string
  /** 1-based number among the week's videos (videos only). */
  n?: number
  /** 0..1: how much of this page is done. */
  done: number
}

export interface UnitSummary {
  week: number
  title: string
  items: UnitItem[]
  /** 0..1 over all the week's pages. */
  progress: number
  done: boolean
  started: boolean
}

/** Points per level, as on Khan Academy: tried counts a little, mastered counts fully. */
export const LEVEL_POINTS: Record<MasteryLevel, number> = { 'ikke-startet': 0, oevet: 30, kendt: 70, mestret: 100 }

export function unitSummaries(course: CourseData, checks: Map<string, boolean>, attempts: Attempt[], settings: Map<string, unknown>): UnitSummary[] {
  const slug = course.meta.slug
  return course.weeks.map((w) => {
    const videos = w.videos || Array.from({ length: w.videoCount }, (_, i) => ({ id: `${w.number}.${i + 1}` }))
    const lesson = settings.get(`lesson:${slug}/${w.number}`) as { done?: boolean } | undefined
    const tried = new Set(attempts.filter((a) => a.course === slug && a.week === w.number && a.source === 'bank').map((a) => a.exerciseId)).size
    let ticked = 0
    for (let i = 0; i < w.checkpointCount; i++) if (checks.get(checkpointId(slug, w.number, i))) ticked++
    const items: UnitItem[] = [
      ...videos.map((v, i): UnitItem => ({ kind: 'video', page: `video-${v.id}`, n: i + 1, done: videoWatched(checks, slug, v) ? 1 : 0 })),
      { kind: 'laes', page: 'laes', done: lesson?.done ? 1 : 0 },
      ...(w.exerciseCount ? [{ kind: 'oev' as const, page: 'oev', done: Math.min(1, tried / w.exerciseCount) }] : []),
      ...(w.checkpointCount ? [{ kind: 'checkpoint' as const, page: 'checkpoint', done: ticked / w.checkpointCount }] : []),
    ]
    const progress = items.reduce((s, it) => s + it.done, 0) / items.length
    return {
      week: w.number,
      title: w.title,
      items,
      progress,
      done: w.checkpointCount > 0 ? ticked === w.checkpointCount : progress === 1,
      started: items.some((it) => it.done > 0),
    }
  })
}

/** The first page in the week that isn't done (or the first page). */
export function nextItem(unit: UnitSummary): UnitItem {
  return unit.items.find((it) => it.done < 1) || unit.items[0]
}

export interface CourseMasterySummary {
  /** 0..100 */
  percent: number
  counts: Record<MasteryLevel, number>
  levels: { topic: string; level: MasteryLevel }[]
}

export function courseMastery(course: CourseData, attempts: Attempt[], now: number): CourseMasterySummary {
  const own = attempts.filter((a) => a.course === course.meta.slug)
  const levels = course.meta.topics.map((t) => ({ topic: t.id, level: masteryLevel(computeMastery(own.filter((a) => a.topics.includes(t.id)), now)) }))
  const counts = Object.fromEntries(MASTERY_LEVELS.map((l) => [l, levels.filter((x) => x.level === l).length])) as Record<MasteryLevel, number>
  const percent = levels.length ? Math.round(levels.reduce((s, x) => s + LEVEL_POINTS[x.level], 0) / levels.length) : 0
  return { percent, counts, levels }
}
