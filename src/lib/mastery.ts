// Mastery model per topic (and per week).
//
// 1. Each attempt has a score s ∈ [0, 1]: an auto-check gives 1 or 0, and the
//    self-ratings give 0 / 0.33 / 0.66 / 1.
// 2. Attempts are combined in time order as an exponentially weighted
//    average, starting from 0:  m ← m + α·w·(s − m),  α = 0.35,
//    where w = 0.8 / 1.0 / 1.25 for ★ / ★★ / ★★★ (harder exercises move the
//    estimate more). α·w is capped at 1.
// 3. Forgetting: the estimate decays towards 0 with a half-life that grows
//    with practice: halfLife = 10 · (1 + n/4) days (n = number of attempts),
//    so mastery(t) = m · 2^(−daysSinceLast / halfLife).
// 4. Confidence = 1 − e^(−n/4): about 0.5 after 3 attempts and 0.9 after 9.

import type { Attempt } from './storage/types'
import { DAY } from './srs'

export const ALPHA = 0.35
export const DIFF_WEIGHT = { 1: 0.8, 2: 1.0, 3: 1.25 } as const

export interface Mastery {
  mastery: number // with forgetting, 0..1
  raw: number // without forgetting
  confidence: number // 0..1
  attempts: number
  lastTs?: number
  recent: number[] // last scores, newest last (max 10)
  byDifficulty: Record<1 | 2 | 3, { n: number; avg: number }>
}

export function computeMastery(attempts: Pick<Attempt, 'score' | 'difficulty' | 'ts'>[], now: number): Mastery {
  const sorted = [...attempts].sort((a, b) => a.ts - b.ts)
  let m = 0
  const byD: Mastery['byDifficulty'] = { 1: { n: 0, avg: 0 }, 2: { n: 0, avg: 0 }, 3: { n: 0, avg: 0 } }
  for (const a of sorted) {
    const k = Math.min(1, ALPHA * DIFF_WEIGHT[a.difficulty])
    m += k * (a.score - m)
    const d = byD[a.difficulty]
    d.avg = (d.avg * d.n + a.score) / (d.n + 1)
    d.n += 1
  }
  const n = sorted.length
  const lastTs = n ? sorted[n - 1].ts : undefined
  const halfLife = 10 * (1 + n / 4)
  const days = lastTs ? Math.max(0, (now - lastTs) / DAY) : 0
  const decayed = n ? m * Math.pow(2, -days / halfLife) : 0
  return {
    mastery: decayed,
    raw: m,
    confidence: 1 - Math.exp(-n / 4),
    attempts: n,
    lastTs,
    recent: sorted.slice(-10).map((a) => a.score),
    byDifficulty: byD,
  }
}

/** Group attempts by topic and compute mastery for each topic. */
export function masteryByTopic(attempts: Attempt[], now: number): Map<string, Mastery> {
  const groups = new Map<string, Attempt[]>()
  for (const a of attempts) for (const t of a.topics) groups.set(t, [...(groups.get(t) || []), a])
  const out = new Map<string, Mastery>()
  for (const [t, list] of groups) out.set(t, computeMastery(list, now))
  return out
}

export function masteryByWeek(attempts: Attempt[], course: string, now: number): Map<number, Mastery> {
  const groups = new Map<number, Attempt[]>()
  for (const a of attempts) if (a.course === course && a.week > 0) groups.set(a.week, [...(groups.get(a.week) || []), a])
  const out = new Map<number, Mastery>()
  for (const [w, list] of groups) out.set(w, computeMastery(list, now))
  return out
}

/** Khan-style levels shown to the learner. */
export type MasteryLevel = 'ikke-startet' | 'oevet' | 'kendt' | 'mestret'
export const MASTERY_LEVEL_LABEL: Record<MasteryLevel, string> = { 'ikke-startet': 'Ikke startet', oevet: 'Øvet', kendt: 'Kendt', mestret: 'Mestret' }
export const MASTERY_LEVELS: MasteryLevel[] = ['ikke-startet', 'oevet', 'kendt', 'mestret']

/**
 * Øvet: you have tried it. Kendt: mostly right (≥ 0,5). Mestret: reliably
 * right (≥ 0,8) on enough evidence (confidence ≥ 0,5, i.e. about 3 attempts).
 */
export function masteryLevel(m: Pick<Mastery, 'mastery' | 'confidence' | 'attempts'>): MasteryLevel {
  if (!m.attempts) return 'ikke-startet'
  if (m.mastery >= 0.8 && m.confidence >= 0.5) return 'mestret'
  if (m.mastery >= 0.5) return 'kendt'
  return 'oevet'
}
