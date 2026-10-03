// Parametric exercise generators. One file per generator in
// content/generators/<id>.ts, default-exporting a Generator. They are
// registered automatically.

import type { AutoCheck, Difficulty } from '@/types/content'
import type { Rng } from './rng'
import { makeRng } from './rng'
import { makeChoices, type Choices } from './choices'
import { formatNumber } from './format'

export interface GeneratedExercise {
  /** Mini-Markdown: paragraphs, **bold**, *italic*, lists, $math$, $$math$$, | tables |. */
  prompt: string
  /** First step towards the answer, without giving it away. Required: every exercise has a hint. */
  hint: string
  /** Optional further hint steps, shown one at a time after `hint`. */
  moreHints?: string[]
  /** Explains every step. */
  solution: string
  check: AutoCheck
  /** Plausible wrong answers (typical mistakes) for the multiple-choice version. */
  distractors?: (number | string)[]
}

export interface Generator {
  id: string
  title: string
  course: string
  topics: string[]
  /** Difficulties this generator can produce. */
  difficulties: Difficulty[]
  generate(seed: number, difficulty: Difficulty): GeneratedExercise
}

/** Helper so generator files get types and a seeded RNG for free. */
export function defineGenerator(g: Omit<Generator, 'generate'> & { make: (rng: Rng, difficulty: Difficulty) => GeneratedExercise }): Generator {
  const { make, ...rest } = g
  return { ...rest, generate: (seed, difficulty) => make(makeRng(seed ^ (difficulty * 0x9e3779b1)), difficulty) }
}

const modules = import.meta.glob('../../content/generators/*.ts', { eager: true }) as Record<string, { default: Generator }>

export const generators: Generator[] = Object.entries(modules)
  .filter(([path]) => !path.split('/').pop()!.startsWith('_'))
  .map(([, m]) => m.default)
  .filter(Boolean)
  .sort((a, b) => a.id.localeCompare(b.id))

/** Multiple-choice version of a generated exercise (null if none can be made). */
export function generatedChoices(ex: GeneratedExercise, seed: number): Choices | null {
  return makeChoices(ex.check, seed, ex.distractors)
}

export const generatorById = new Map(generators.map((g) => [g.id, g]))

/** Add generators at runtime (exercise templates from course files). Same id replaces. */
export function registerGenerators(list: Generator[]) {
  for (const g of list) {
    const i = generators.findIndex((x) => x.id === g.id)
    if (i >= 0) generators[i] = g
    else generators.push(g)
    generatorById.set(g.id, g)
  }
}

export const generatedId = (g: string, seed: number, d: Difficulty) => `gen:${g}:${seed}:${d}`

export function parseGeneratedId(id: string): { generatorId: string; seed: number; difficulty: Difficulty } | null {
  const m = /^gen:([\w/-]+):(\d+):([123])$/.exec(id)
  return m ? { generatorId: m[1], seed: Number(m[2]), difficulty: Number(m[3]) as Difficulty } : null
}

// ---------- formatting helpers for generator text (US number format, see format.ts)

/** A number for running text: 1,234.5 (up to `decimals` decimals). */
export function da(x: number, decimals = 2): string {
  return formatNumber(x, { decimals })
}

/** A number for use inside $…$: 1234.5 (no thousands separator). */
export function tex(x: number, decimals = 2): string {
  return formatNumber(x, { decimals, math: true })
}

export const pct = (x: number, decimals = 2) => `${da(x * 100, decimals)}%`
export const texPct = (x: number, decimals = 2) => `${tex(x * 100, decimals)}\\%`

export function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a
}

export function frac(n: number, d: number): string {
  const g = gcd(n, d) || 1
  let [a, b] = [n / g, d / g]
  if (b < 0) [a, b] = [-a, -b]
  return b === 1 ? `${a}` : `\\tfrac{${a}}{${b}}`
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26 via erf, |error| < 1.5e-7). */
export function normCdf(x: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(x) / Math.SQRT2))
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2)
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y)
}

/** Inverse standard normal CDF (Acklam's algorithm, rel. error < 1.2e-9). */
export function normInv(p: number): number {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239]
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const pl = 0.02425
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > 1 - pl) return -normInv(1 - p)
  const q = p - 0.5
  const r = q * q
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

export function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return Math.round(r)
}
