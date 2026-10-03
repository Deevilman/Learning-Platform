// Multiple-choice variants of auto-checked exercises. A numeric answer gets
// three plausible wrong answers (typical slips: factor 10, sign, percent vs.
// fraction, off by one, doubling/halving) unless the exercise supplies its
// own. Used by generators at runtime and by the content build for bank
// exercises, so it only imports relatively.

import type { AutoCheck } from '../types/content'
import { makeRng } from './rng'
import { evaluate, numericClose } from './check'

export interface Choices {
  options: string[] // mini-Markdown (may contain $math$)
  correct: number
}

/** Danish number with a fixed number of decimals (trailing zeros kept for alignment). */
export function daFixed(x: number, decimals: number): string {
  const r = Math.abs(x).toFixed(decimals)
  const [i, f] = r.split('.')
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const neg = x < 0 && Number(r) !== 0
  return `${neg ? '−' : ''}${int}${f ? ',' + f : ''}`
}

/** Decimals needed to show `answer` so a learner can tell the options apart. */
export function decimalsFor(answer: number, tolerance?: number): number {
  if (tolerance && tolerance > 0) return Math.min(6, Math.max(0, Math.ceil(-Math.log10(tolerance * 2))))
  for (let d = 0; d <= 4; d++) if (Math.abs(Number(answer.toFixed(d)) - answer) <= 1e-9 * Math.max(1, Math.abs(answer))) return d
  return 4
}

function stableHash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function shuffleWithCorrect(options: string[], seed: number): Choices {
  const rng = makeRng(seed)
  const idx = options.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return { options: idx.map((i) => options[i]), correct: idx.indexOf(0) }
}

function numericDistractors(a: number, decimals: number): number[] {
  if (decimals === 0 && Number.isInteger(a)) {
    // counts and whole amounts: neighbours, doubling/halving, factor 10; a sign slip only last
    const c = [a + 1, a - 1, a + 2, a * 2, a - 2, Math.round(a * 1.5), Math.round(a / 2), a + 3, a * 10, a + 10, a - 3, -a]
    return c.filter((x) => isFinite(x) && (a < 0 || x >= 0 || x === -a))
  }
  const step = 10 ** -decimals
  // zero or tiny answers: multiplying does nothing, so step away instead
  if (Math.abs(a) < 10 * step) {
    const u = 10 * step
    return [a + u, a - u, a + 2 * u, a + 5 * u, a - 2 * u, a + 3 * u, a + 10 * u]
  }
  const near = step * Math.max(1, Math.round((Math.abs(a) * 0.1) / step))
  const c = [a * 10, a / 10, a * 2, a / 2, a + near, a - near, -a, a * 100, a / 100, a * 1.5, a + 2 * near, a - 2 * near]
  return c.filter((x) => isFinite(x))
}

/**
 * Turn an auto-check into four options with exactly one correct.
 * Returns null when no sensible options can be made (free text without distractors, code output).
 */
export function makeChoices(check: AutoCheck, seedKey: string | number, distractors: (number | string)[] = []): Choices | null {
  const seed = typeof seedKey === 'number' ? seedKey : stableHash(seedKey)
  if (check.type === 'choice') return { options: check.options, correct: check.correct }
  const unit = check.type === 'numeric' && check.unit ? (check.unit === '%' ? '\u00a0%' : `\u00a0${check.unit}`) : ''
  if (check.type === 'numeric') {
    const d = decimalsFor(check.answer, check.tolerance)
    const show = (x: number) => daFixed(x, d) + unit
    const right = show(check.answer)
    const seen = new Set([right])
    const wrong: string[] = []
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && !numericClose(x, check.answer, Math.max(check.tolerance ?? 0, 10 ** -d / 2) * 2, false)
    const generic = numericDistractors(check.answer, d)
    const pool = [...distractors.filter((x): x is number => typeof x === 'number'), ...shuffle(generic.slice(0, 6), seed), ...generic.slice(6)]
    for (const x of pool) {
      if (wrong.length === 3) break
      if (!ok(x)) continue
      const s = show(x)
      if (seen.has(s)) continue
      seen.add(s)
      wrong.push(s)
    }
    if (wrong.length < 3) return null
    return shuffleWithCorrect([right, ...wrong], seed)
  }
  if (check.type === 'numeric-list') {
    const d = Math.max(...check.answers.map((x) => decimalsFor(x, check.tolerance)))
    const show = (xs: number[]) => xs.map((x) => daFixed(x, d)).join('; ')
    const right = show(check.answers)
    const seen = new Set([right])
    const wrong: string[] = []
    const cands: number[][] = []
    if (check.ordered !== false && check.answers.length > 1) cands.push([...check.answers].reverse())
    check.answers.forEach((x, i) => {
      for (const y of [x + 1, x - 1, x * 2, -x]) cands.push(check.answers.map((v, j) => (i === j ? y : v)))
    })
    for (const c of shuffle(cands, seed)) {
      if (wrong.length === 3) break
      // a distractor must not itself be a correct answer
      if (evaluate(check, show(c).replace(/−/g, '-')).correct) continue
      const s = show(c)
      if (seen.has(s)) continue
      seen.add(s)
      wrong.push(s)
    }
    for (const x of distractors) if (typeof x === 'string' && wrong.length < 3 && !seen.has(x)) wrong.push(x)
    return wrong.length === 3 ? shuffleWithCorrect([right, ...wrong], seed) : null
  }
  if (check.type === 'text') {
    const wrong = distractors.filter((x): x is string => typeof x === 'string').slice(0, 3)
    return wrong.length === 3 ? shuffleWithCorrect([check.answers[0], ...wrong], seed) : null
  }
  return null
}

function shuffle<T>(xs: T[], seed: number): T[] {
  const rng = makeRng(seed ^ 0x5bd1e995)
  const out = [...xs]
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** The choice check that grades a multiple-choice answer (the option index). */
export const choiceCheck = (c: Choices): AutoCheck => ({ type: 'choice', options: c.options, correct: c.correct })

/** Shuffle hand-written options (first = correct) deterministically per exercise. */
export function shuffledOptions(correctFirst: string[], seedKey: string): Choices {
  return shuffleWithCorrect(correctFirst, stableHash(seedKey))
}
