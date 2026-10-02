// Shared helpers for propositional-logic generators.
import type { Rng } from '@/lib/rng'

export type F = { k: 'v'; n: string } | { k: 'not'; a: F } | { k: 'and' | 'or' | 'imp' | 'iff'; a: F; b: F }
export type Assign = Record<string, boolean>

export const v = (n: string): F => ({ k: 'v', n })
export const not = (a: F): F => ({ k: 'not', a })
export const bin = (k: 'and' | 'or' | 'imp' | 'iff', a: F, b: F): F => ({ k, a, b })

export function ev(f: F, s: Assign): boolean {
  switch (f.k) {
    case 'v':
      return s[f.n]
    case 'not':
      return !ev(f.a, s)
    case 'and':
      return ev(f.a, s) && ev(f.b, s)
    case 'or':
      return ev(f.a, s) || ev(f.b, s)
    case 'imp':
      return !ev(f.a, s) || ev(f.b, s)
    case 'iff':
      return ev(f.a, s) === ev(f.b, s)
  }
}

const OP = { and: '\\land', or: '\\lor', imp: '\\to', iff: '\\leftrightarrow' } as const

export function tex(f: F, top = true): string {
  switch (f.k) {
    case 'v':
      return f.n
    case 'not':
      return `\\neg ${tex(f.a, false)}`
    default: {
      const s = `${tex(f.a, false)} ${OP[f.k]} ${tex(f.b, false)}`
      return top ? s : `(${s})`
    }
  }
}

export function vars(f: F, acc = new Set<string>()): Set<string> {
  if (f.k === 'v') acc.add(f.n)
  else if (f.k === 'not') vars(f.a, acc)
  else {
    vars(f.a, acc)
    vars(f.b, acc)
  }
  return acc
}

/** All assignments in the standard order (S before F, first variable slowest). */
export function rows(names: string[]): Assign[] {
  const out: Assign[] = []
  const n = names.length
  for (let i = 0; i < 2 ** n; i++) {
    const a: Assign = {}
    names.forEach((x, j) => (a[x] = !((i >> (n - 1 - j)) & 1)))
    out.push(a)
  }
  return out
}

export function randomFormula(rng: Rng, names: string[], depth: number): F {
  if (depth <= 0 || (depth < 2 && rng.chance(0.3))) {
    const x = v(rng.pick(names))
    return rng.chance(0.25) ? not(x) : x
  }
  if (rng.chance(0.15)) return not(randomFormula(rng, names, depth - 1))
  const k = rng.pick(['and', 'or', 'imp', 'imp', 'iff'] as const)
  return bin(k, randomFormula(rng, names, depth - 1), randomFormula(rng, names, depth - 1))
}

export const SF = (b: boolean) => (b ? 'S' : 'F')

/** Markdown truth table with the given formula columns. */
export function truthTable(names: string[], cols: { label: string; f: F }[]): string {
  const head = `| ${[...names, ...cols.map((c) => c.label)].join(' | ')} |`
  const sep = `|${[...names, ...cols].map(() => ':-:').join('|')}|`
  const body = rows(names).map((a) => `| ${[...names.map((x) => SF(a[x])), ...cols.map((c) => SF(ev(c.f, a)))].join(' | ')} |`)
  return [head, sep, ...body].join('\n')
}
