// Endless training session. Mixes (1) bank exercises that are due under
// spaced repetition, (2) freshly generated exercises in the chosen topics and
// (3) a few bank exercises never tried before. Difficulty adapts: up after 3
// correct answers in a row, down after 2 mistakes in a row.

import type { Difficulty, ExerciseSummary } from '@/types/content'
import type { SrsRec } from './storage/types'
import type { Generator, GeneratedExercise } from './generators'

export type TrainItem =
  | { kind: 'bank'; exerciseId: string; reason: 'due' | 'new' | 'review' }
  | { kind: 'generated'; generatorId: string; seed: number; difficulty: Difficulty; exercise: GeneratedExercise }

export interface SessionContext {
  bank: ExerciseSummary[] // candidate bank exercises (already filtered to scope)
  srs: Map<string, SrsRec>
  attempted: Set<string> // bank ids with at least one attempt
  generators: Generator[] // candidate generators (already filtered to scope)
  now: number
  random?: () => number
  startDifficulty?: Difficulty
}

export const MIX = { due: 0.4, generated: 0.45, new: 0.15 }

export class TrainingSession {
  level: Difficulty
  private streakOk = 0
  private streakBad = 0
  private shownBank = new Set<string>()
  private seenPrompts = new Set<string>()
  private rnd: () => number
  count = 0

  constructor(private ctx: SessionContext) {
    this.level = ctx.startDifficulty || 1
    this.rnd = ctx.random || Math.random
  }

  /** Register the result of the current item (score 0..1). */
  record(score: number) {
    if (score >= 0.66) {
      this.streakOk++
      this.streakBad = 0
      if (this.streakOk >= 3) {
        this.level = Math.min(3, this.level + 1) as Difficulty
        this.streakOk = 0
      }
    } else {
      this.streakBad++
      this.streakOk = 0
      if (this.streakBad >= 2) {
        this.level = Math.max(1, this.level - 1) as Difficulty
        this.streakBad = 0
      }
    }
  }

  private duePool() {
    return this.ctx.bank
      .filter((e) => !this.shownBank.has(e.id))
      .map((e) => ({ e, card: this.ctx.srs.get(e.id) }))
      .filter((x) => x.card && x.card.due <= this.ctx.now)
      .sort((a, b) => a.card!.due - b.card!.due)
      .map((x) => x.e)
  }

  private newPool() {
    const fresh = this.ctx.bank.filter((e) => !this.shownBank.has(e.id) && !this.ctx.attempted.has(e.id))
    // Prefer the current level, then the earliest weeks.
    return fresh.sort((a, b) => Math.abs(a.difficulty - this.level) - Math.abs(b.difficulty - this.level) || a.week - b.week || a.number.localeCompare(b.number, undefined, { numeric: true }))
  }

  private generate(): TrainItem | null {
    const gens = this.ctx.generators
    if (!gens.length) return null
    for (let attempt = 0; attempt < 40; attempt++) {
      const g = gens[Math.floor(this.rnd() * gens.length)]
      const d = g.difficulties.includes(this.level)
        ? this.level
        : g.difficulties.reduce((best, x) => (Math.abs(x - this.level) < Math.abs(best - this.level) ? x : best), g.difficulties[0])
      const seed = Math.floor(this.rnd() * 2 ** 31)
      const exercise = g.generate(seed, d)
      const key = `${g.id}|${exercise.prompt}`
      if (this.seenPrompts.has(key)) continue
      this.seenPrompts.add(key)
      return { kind: 'generated', generatorId: g.id, seed, difficulty: d, exercise }
    }
    return null
  }

  next(): TrainItem | null {
    const due = this.duePool()
    const fresh = this.newPool()
    const pools: { w: number; take: () => TrainItem | null }[] = []
    if (due.length) pools.push({ w: MIX.due, take: () => this.bank(due[0].id, 'due') })
    if (this.ctx.generators.length) pools.push({ w: MIX.generated, take: () => this.generate() })
    if (fresh.length) pools.push({ w: MIX.new, take: () => this.bank(fresh[0].id, 'new') })
    if (!pools.length) {
      // Nothing due, nothing new and no generators: review the oldest-reviewed bank exercise.
      const rest = this.ctx.bank.filter((e) => !this.shownBank.has(e.id))
      if (!rest.length) {
        this.shownBank.clear()
        return this.ctx.bank.length ? this.bank(this.ctx.bank[0].id, 'review') : null
      }
      rest.sort((a, b) => (this.ctx.srs.get(a.id)?.last || 0) - (this.ctx.srs.get(b.id)?.last || 0))
      return this.bank(rest[0].id, 'review')
    }
    const total = pools.reduce((s, p) => s + p.w, 0)
    let r = this.rnd() * total
    for (const p of pools) {
      r -= p.w
      if (r <= 0) {
        const item = p.take()
        if (item) return this.tick(item)
        break
      }
    }
    for (const p of pools) {
      const item = p.take()
      if (item) return this.tick(item)
    }
    return null
  }

  private tick(item: TrainItem) {
    this.count++
    return item
  }

  private bank(exerciseId: string, reason: 'due' | 'new' | 'review'): TrainItem {
    this.shownBank.add(exerciseId)
    return { kind: 'bank', exerciseId, reason }
  }
}

/** Starting difficulty from the learner's mastery in the chosen topics. */
export function startLevel(mastery: number | undefined): Difficulty {
  if (mastery === undefined || mastery < 0.4) return 1
  if (mastery < 0.75) return 2
  return 3
}
