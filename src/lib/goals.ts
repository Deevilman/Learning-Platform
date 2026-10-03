// Daily goal ("3 opgaver om dagen") and streak. Counted on local days.
// Meant to motivate, never to shame: a broken streak is simply a fresh start.

import type { Attempt } from './storage/types'

export interface GoalSettings {
  enabled: boolean
  perDay: number
}
export const GOAL_KEY = 'goal'
export const DEFAULT_GOAL: GoalSettings = { enabled: true, perDay: 3 }
export const GOAL_CHOICES = [1, 3, 5, 10]

/** Local calendar day as "YYYY-MM-DD". */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Exercises worked on per day (several attempts at the same exercise count once). */
export function perDay(attempts: Pick<Attempt, 'ts' | 'exerciseId'>[]): Map<string, number> {
  const sets = new Map<string, Set<string>>()
  for (const a of attempts) {
    const k = dayKey(a.ts)
    if (!sets.has(k)) sets.set(k, new Set())
    sets.get(k)!.add(a.exerciseId)
  }
  return new Map([...sets].map(([k, s]) => [k, s.size]))
}

export interface GoalStatus {
  today: number
  goal: number
  reached: boolean
  /** Days in a row with the goal reached, ending today (or yesterday, if today is not done yet). */
  streak: number
  best: number
}

export function goalStatus(attempts: Pick<Attempt, 'ts' | 'exerciseId'>[], goal: number, now: number): GoalStatus {
  const days = perDay(attempts)
  const today = days.get(dayKey(now)) || 0
  const met = (k: string) => (days.get(k) || 0) >= goal
  const back = (n: number) => {
    const d = new Date(now)
    d.setHours(12, 0, 0, 0) // avoid DST edges
    d.setDate(d.getDate() - n)
    return dayKey(d.getTime())
  }
  let streak = 0
  for (let n = met(back(0)) ? 0 : 1; met(back(n)); n++) streak++
  // best streak over the whole history
  const keys = [...days.keys()].filter(met).sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const k of keys) {
    const p = new Date(`${k}T12:00:00`)
    p.setDate(p.getDate() - 1)
    run = prev === dayKey(p.getTime()) ? run + 1 : 1
    best = Math.max(best, run)
    prev = k
  }
  return { today, goal, reached: today >= goal, streak, best: Math.max(best, streak) }
}
