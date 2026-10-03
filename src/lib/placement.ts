// "Hvad kan du allerede?" — a short placement test per course.
// Up to three auto-checked questions per week, easy → hard. A week stops as
// soon as the result is clear (2 right or 2 wrong). The test stops after two
// weeks in a row that are not known yet (the learner may continue). Weeks
// answered well are marked "Kan du allerede"; the start point is the first
// week that is not.

import type { Difficulty } from '@/types/content'

export type PlacementQuestion =
  | { kind: 'quiz'; week: number; exerciseId: string; difficulty: Difficulty }
  | { kind: 'generated'; week: number; generatorId: string; difficulty: Difficulty; seed: number }

export interface WeekPool {
  week: number
  quizzes: { exerciseId: string; difficulty: Difficulty }[]
  generators: { id: string; difficulties: Difficulty[] }[]
}

export const PER_WEEK = 3

/** Pick up to three questions for a week: the week's own quizzes first, then generated ones; easy → hard. */
export function questionsForWeek(pool: WeekPool, seed: number, count = PER_WEEK): PlacementQuestion[] {
  const qs: PlacementQuestion[] = pool.quizzes.map((q) => ({ kind: 'quiz', week: pool.week, exerciseId: q.exerciseId, difficulty: q.difficulty }))
  // one generated question per generator and difficulty, spread over generators
  const gen: PlacementQuestion[] = []
  for (const d of [1, 2, 3] as Difficulty[])
    pool.generators.forEach((g, i) => {
      if (g.difficulties.includes(d)) gen.push({ kind: 'generated', week: pool.week, generatorId: g.id, difficulty: d, seed: seed + pool.week * 101 + i * 7 + d })
    })
  // prefer variety: alternate quizzes and generated questions before repeating a source
  const picked: PlacementQuestion[] = []
  const sources = [qs, gen]
  for (let i = 0; picked.length < count && (qs.length || gen.length); i++) {
    const src = sources[i % 2].length ? sources[i % 2] : sources[(i + 1) % 2]
    // take the easiest remaining from this source, avoiding a generator we already used
    src.sort((a, b) => a.difficulty - b.difficulty)
    const idx = src.findIndex((q) => q.kind !== 'generated' || !picked.some((p) => p.kind === 'generated' && p.generatorId === q.generatorId))
    picked.push(src.splice(idx < 0 ? 0 : idx, 1)[0])
  }
  return picked.sort((a, b) => a.difficulty - b.difficulty)
}

export type WeekResult = 'known' | 'unknown' | 'untested'

export interface PlacementState {
  weeks: number[] // weeks in course order
  plan: Record<number, PlacementQuestion[]>
  answers: Record<number, boolean[]>
  weekIndex: number
  /** Set when the test stopped early because two weeks in a row were not known. */
  stoppedEarly: boolean
  finished: boolean
}

export function startPlacement(pools: WeekPool[], seed: number): PlacementState {
  const plan: Record<number, PlacementQuestion[]> = {}
  for (const p of pools) plan[p.week] = questionsForWeek(p, seed)
  const state: PlacementState = { weeks: pools.map((p) => p.week), plan, answers: {}, weekIndex: 0, stoppedEarly: false, finished: false }
  return skipEmpty(state)
}

function skipEmpty(s: PlacementState): PlacementState {
  while (s.weekIndex < s.weeks.length && !s.plan[s.weeks[s.weekIndex]].length) s.weekIndex++
  if (s.weekIndex >= s.weeks.length) s.finished = true
  return s
}

/** Is the result for a week clear from these answers? */
export function weekVerdict(answers: boolean[], available: number): WeekResult | null {
  const right = answers.filter(Boolean).length
  const wrong = answers.length - right
  if (right >= 2) return 'known'
  if (wrong >= 2) return 'unknown'
  if (answers.length >= available) {
    // ran out of questions: one right of one is "known", anything less is not
    return available > 0 && right === available ? 'known' : answers.length ? 'unknown' : 'untested'
  }
  return null
}

export function currentQuestion(s: PlacementState): PlacementQuestion | null {
  if (s.finished) return null
  const w = s.weeks[s.weekIndex]
  return s.plan[w][(s.answers[w] || []).length] || null
}

/** Record an answer and move on. Returns a new state. */
export function answerPlacement(prev: PlacementState, correct: boolean): PlacementState {
  const s: PlacementState = { ...prev, answers: { ...prev.answers } }
  const w = s.weeks[s.weekIndex]
  s.answers[w] = [...(s.answers[w] || []), correct]
  if (weekVerdict(s.answers[w], s.plan[w].length) === null) return s
  s.weekIndex++
  skipEmpty(s)
  // stop after two tested weeks in a row that are not known
  const tested = s.weeks.slice(0, s.weekIndex).filter((x) => s.answers[x]?.length)
  const last2 = tested.slice(-2)
  if (!s.finished && last2.length === 2 && last2.every((x) => weekVerdict(s.answers[x], s.plan[x].length) === 'unknown')) {
    s.finished = true
    s.stoppedEarly = true
  }
  return s
}

/** Continue a test that stopped early. */
export function continuePlacement(prev: PlacementState): PlacementState {
  return skipEmpty({ ...prev, finished: false, stoppedEarly: false })
}

export function placementResults(s: PlacementState): Record<number, WeekResult> {
  const out: Record<number, WeekResult> = {}
  for (const w of s.weeks) {
    const a = s.answers[w]
    out[w] = a?.length ? weekVerdict(a, s.plan[w].length) || 'unknown' : 'untested'
  }
  return out
}

/** First week that is not known (untested weeks after a stop count as not known). */
export function startWeek(results: Record<number, WeekResult>, weeks: number[]): number {
  return weeks.find((w) => results[w] !== 'known') ?? weeks[weeks.length - 1]
}

export const totalQuestions = (s: PlacementState) => Object.values(s.answers).reduce((n, a) => n + a.length, 0)

/** "Ugens test": a few more questions than the placement test, saved per week. */
export const WEEK_TEST_SIZE = 5
export const WEEK_TEST_PASS = 4
export const weekTestKey = (course: string, week: number) => `weektest:${course}/${week}`
export interface WeekTestRecord {
  best: number
  of: number
  date: number
}

/** Saved per course in settings ("placement:<slug>"). */
export interface PlacementRecord {
  date: number
  results: Record<number, WeekResult>
  start: number
}
export const placementKey = (course: string) => `placement:${course}`
