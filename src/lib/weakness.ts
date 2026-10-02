// Weakness finder: ranks the topics the learner has reached by how much they
// need training, and explains why in plain Danish.

import type { CourseMeta } from '@/types/content'
import type { Attempt } from './storage/types'
import { computeMastery, type Mastery } from './mastery'
import { DAY } from './srs'

export interface WeakTopic {
  course: string
  topic: string
  name: string
  score: number // higher = weaker
  mastery: Mastery
  reasons: string[]
}

const STARS = { 1: '★', 2: '★★', 3: '★★★' } as const
const pct = (x: number) => `${Math.round(x * 100)} %`

/**
 * reachedWeeks: per course, the weeks the learner has started (any attempt,
 * ticked video/checkpoint, or visited). Topics outside reached weeks are not
 * reported — you can't be weak at something you haven't started.
 */
export function findWeakTopics(courses: CourseMeta[], attempts: Attempt[], reachedWeeks: Map<string, Set<number>>, now: number, limit = 5): WeakTopic[] {
  const out: WeakTopic[] = []
  for (const c of courses) {
    const reached = reachedWeeks.get(c.slug)
    if (!reached || !reached.size) continue
    for (const t of c.topics) {
      if (!t.weeks.some((w) => reached.has(w))) continue
      const list = attempts.filter((a) => a.course === c.slug && a.topics.includes(t.id))
      const m = computeMastery(list, now)
      const reasons: string[] = []
      const last5 = m.recent.slice(-5)
      const wrong = last5.filter((s) => s < 0.5).length
      if (last5.length >= 3 && wrong >= 2) reasons.push(`${wrong} af de sidste ${last5.length} forkert`)
      for (const d of [1, 2, 3] as const) {
        const bd = m.byDifficulty[d]
        if (bd.n >= 2 && bd.avg < 0.5) reasons.push(`${STARS[d]}-øvelser under 50 % (${pct(bd.avg)})`)
      }
      if (m.lastTs) {
        const days = Math.floor((now - m.lastTs) / DAY)
        if (days >= 14) reasons.push(`ikke øvet i ${days} dage`)
      }
      if (m.attempts === 0) reasons.push('ikke øvet endnu')
      else if (m.attempts < 3) reasons.push(`kun ${m.attempts} forsøg`)
      if (m.attempts >= 3 && m.mastery < 0.6) reasons.push(`mestring ${pct(m.mastery)}`)

      // Weakness score: low (forgetting-adjusted) mastery dominates; topics
      // with few attempts get a smaller, but non-zero, push.
      const score = (1 - m.mastery) * (0.4 + 0.6 * m.confidence) + (m.attempts === 0 ? 0.3 : 0) + (wrong >= 2 ? 0.15 : 0)
      if (m.mastery >= 0.85 && m.confidence > 0.6) continue
      out.push({ course: c.slug, topic: t.id, name: t.name, score, mastery: m, reasons: reasons.length ? reasons : [`mestring ${pct(m.mastery)}`] })
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit)
}
