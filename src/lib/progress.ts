// Progress bookkeeping: which weeks are reached/done, course completion and
// the "what next" recommendation. Pure functions over storage rows.

import type { CourseData, CourseMeta } from '@/types/content'
import type { Attempt, CheckRec } from './storage/types'
import { computeMastery } from './mastery'

/** Legacy, position-based id ("video:quant/3.2"). */
export const videoCheckId = (course: string, itemId: string) => `video:${course}/${itemId}`
/**
 * Ids under which "watched" is stored for a video: the stable one from the
 * course's video key (kept when the course is re-uploaded and videos move),
 * then the legacy position-based one. Write the first; read either.
 */
export function videoCheckIds(course: string, item: { id: string; progressKey?: string }): string[] {
  const week = item.id.split('.')[0]
  return item.progressKey ? [`video:${course}/${week}/k:${item.progressKey}`, videoCheckId(course, item.id)] : [videoCheckId(course, item.id)]
}
export const videoWatched = (checks: Map<string, boolean>, course: string, item: { id: string; progressKey?: string }) => videoCheckIds(course, item).some((id) => checks.get(id))
export const checkpointId = (course: string, week: number, i: number) => `checkpoint:${course}/${week}/${i}`
export const visitId = (course: string, week: number) => `visit:${course}/${week}`
export const projectCheckId = (course: string, part: string, i: number) => `project:${course}/${part}/${i}`

/** Weeks the learner has started, per course. */
export function reachedWeeks(attempts: Attempt[], checks: CheckRec[]): Map<string, Set<number>> {
  const out = new Map<string, Set<number>>()
  const add = (c: string, w: number) => {
    if (!w) return
    if (!out.has(c)) out.set(c, new Set())
    out.get(c)!.add(w)
  }
  for (const a of attempts) add(a.course, a.week)
  for (const ch of checks) {
    if (!ch.value) continue
    const m = /^(?:video|checkpoint|visit):([\w-]+)\/(\d+)[./]/.exec(ch.id + '/')
    if (m) add(m[1], Number(m[2]))
  }
  return out
}

export interface WeekProgress {
  week: number
  videosDone: number
  videos: number
  exercisesDone: number
  exercises: number
  checkpointDone: number
  checkpoint: number
  done: boolean
}

export function weekProgress(course: CourseData, week: number, checks: Map<string, boolean>, attempts: Attempt[], videoIds?: string[]): WeekProgress {
  const ws = course.weeks.find((w) => w.number === week)!
  const items = videoIds ? videoIds.map((id) => ({ id })) : ws.videos || Array.from({ length: ws.videoCount }, (_, i) => ({ id: `${week}.${i + 1}` }))
  const ids = items
  const videosDone = items.filter((v) => videoWatched(checks, course.meta.slug, v)).length
  let checkpointDone = 0
  for (let i = 0; i < ws.checkpointCount; i++) if (checks.get(checkpointId(course.meta.slug, week, i))) checkpointDone++
  const exercisesDone = new Set(attempts.filter((a) => a.course === course.meta.slug && a.week === week && a.source === 'bank').map((a) => a.exerciseId)).size
  return {
    week,
    videosDone,
    videos: ids.length,
    exercisesDone,
    exercises: ws.exerciseCount,
    checkpointDone,
    checkpoint: ws.checkpointCount,
    done: ws.checkpointCount > 0 ? checkpointDone === ws.checkpointCount : false,
  }
}

/** A course is complete when every checkpoint is ticked, or mastery ≥ 0.7 on all its topics. */
export function courseComplete(course: CourseData, checks: Map<string, boolean>, attempts: Attempt[], now: number): boolean {
  const allTicked = course.weeks.every((w) => weekProgress(course, w.number, checks, attempts).done)
  if (allTicked) return true
  const topics = course.meta.topics
  if (!topics.length) return false
  return topics.every((t) => computeMastery(attempts.filter((a) => a.course === course.meta.slug && a.topics.includes(t.id)), now).mastery >= 0.7)
}

export interface NextStep {
  kind: 'week' | 'course' | 'done'
  course: string
  week?: number
  title: string
  reason: string
}

export function nextSteps(
  courses: CourseMeta[],
  data: Map<string, CourseData>,
  checks: Map<string, boolean>,
  attempts: Attempt[],
  currentCourse: string | undefined,
  now: number,
): NextStep[] {
  const out: NextStep[] = []
  const complete = new Map<string, boolean>()
  for (const c of courses) {
    const d = data.get(c.slug)
    complete.set(c.slug, d ? courseComplete(d, checks, attempts, now) : false)
  }
  const order = currentCourse ? [currentCourse, ...courses.map((c) => c.slug).filter((s) => s !== currentCourse)] : courses.map((c) => c.slug)
  for (const slug of order) {
    const d = data.get(slug)
    if (!d) continue
    const started = d.weeks.some((w) => {
      const p = weekProgress(d, w.number, checks, attempts)
      return p.videosDone || p.exercisesDone || p.checkpointDone || checks.get(visitId(slug, w.number))
    })
    if (!started && slug !== currentCourse) continue
    if (complete.get(slug)) {
      for (const n of d.meta.next) {
        const nm = courses.find((c) => c.slug === n)
        if (!nm) {
          out.push({ kind: 'course', course: n, title: n, reason: `Kommer senere — næste skridt efter ${d.meta.title}` })
          continue
        }
        const missing = nm.prerequisites.filter((p) => !complete.get(p))
        out.push({
          kind: 'course',
          course: n,
          title: nm.title,
          reason: missing.length ? `Næste kursus efter ${d.meta.title} (mangler stadig: ${missing.join(', ')})` : `Du har gennemført ${d.meta.title} — fortsæt her`,
        })
      }
      continue
    }
    const next = d.weeks.find((w) => !weekProgress(d, w.number, checks, attempts).done)
    if (next) out.push({ kind: 'week', course: slug, week: next.number, title: `Uge ${next.number}: ${next.title}`, reason: `Næste uge i ${d.meta.title} som du ikke har afsluttet` })
  }
  if (!out.length && courses.length) {
    const first = courses.find((c) => !c.prerequisites.length) || courses[0]
    out.push({ kind: 'week', course: first.slug, week: 1, title: `Uge 1 i ${first.title}`, reason: 'Start her' })
  }
  return out
}
