// Deterministic PRNG (mulberry32) and helpers for exercise generators.
// The same seed always produces the same exercise.

export interface Rng {
  next(): number // [0, 1)
  int(min: number, max: number): number // inclusive
  pick<T>(xs: readonly T[]): T
  shuffle<T>(xs: readonly T[]): T[]
  chance(p: number): boolean
  real(min: number, max: number, decimals?: number): number
  sample<T>(xs: readonly T[], k: number): T[]
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeRng(seed: number): Rng {
  const next = mulberry32(seed)
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (xs) => xs[Math.floor(next() * xs.length)],
    shuffle: (xs) => {
      const a = [...xs]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
    chance: (p) => next() < p,
    real: (min, max, decimals = 2) => {
      const f = 10 ** decimals
      return Math.round((min + next() * (max - min)) * f) / f
    },
    sample: (xs, k) => rng.shuffle(xs).slice(0, k),
  }
  return rng
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 31)
