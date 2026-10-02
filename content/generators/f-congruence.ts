import { defineGenerator } from '@/lib/generators'

const mod = (a: number, n: number) => ((a % n) + n) % n

export default defineGenerator({
  id: 'f-congruence',
  title: 'Restklasser og ækvivalensklasser',
  course: 'foundations',
  topics: ['sets-functions', 'number-systems'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const n = rng.int(3, 12)
    if (d === 1) {
      const a = rng.int(-60, 99)
      const r = mod(a, n)
      return {
        prompt: `Relationen $a \\sim b \\iff n \\mid (a - b)$ med $n = ${n}$ er en ækvivalensrelation på $\\mathbb{Z}$. Hvilket tal $r \\in \\{0, \\dots, ${n - 1}\\}$ ligger i samme klasse som $${a}$?`,
        hint: 'Find $r$ med $0 \\le r < n$ og $n \\mid (a - r)$. Pas på med negative tal.',
        solution: `$${a} = ${n} \\cdot ${(a - r) / n} + ${r}$, så $${n} \\mid (${a} - ${r})$ og $[${a}] = [${r}]$. Svar: **${r}**.`,
        check: { type: 'numeric', answer: r, tolerance: 0 },
      }
    }
    if (d === 2) {
      const a = rng.int(2, 30)
      const b = rng.int(2, 30)
      const op = rng.pick(['+', '\\cdot'])
      const r = op === '+' ? mod(a + b, n) : mod(a * b, n)
      return {
        prompt: `I $\\mathbb{Z}/${n}\\mathbb{Z}$: beregn $[${a}] ${op} [${b}]$. Angiv repræsentanten i $\\{0, \\dots, ${n - 1}\\}$.`,
        hint: 'Regningsarterne er veldefinerede på klasser, så du kan reducere før eller efter.',
        solution: `$[${a}] = [${mod(a, n)}]$ og $[${b}] = [${mod(b, n)}]$. ${op === '+' ? `$${mod(a, n)} + ${mod(b, n)} = ${mod(a, n) + mod(b, n)}$` : `$${mod(a, n)} \\cdot ${mod(b, n)} = ${mod(a, n) * mod(b, n)}$`}, som reduceret mod $${n}$ er **${r}**.`,
        check: { type: 'numeric', answer: r, tolerance: 0 },
      }
    }
    // d = 3: number of equivalence relations on a k-set = Bell number
    const k = rng.int(2, 6)
    const bell = [1, 1, 2, 5, 15, 52, 203][k]
    return {
      prompt: `Hvor mange forskellige ækvivalensrelationer findes der på en mængde med $${k}$ elementer?`,
      hint: 'Ækvivalensrelationer svarer præcist til partitioner (opdelinger i ikke-tomme klasser).',
      solution: `Ækvivalensrelationer ↔ partitioner. Antallet af partitioner af en $${k}$-mængde er Bell-tallet $B_{${k}}$, som opfylder $B_{n+1} = \\sum_{i=0}^{n} \\binom{n}{i} B_i$ med $B_0 = 1$: $1, 1, 2, 5, 15, 52, 203, \\dots$ Svar: **${bell}**.`,
      check: { type: 'numeric', answer: bell, tolerance: 0 },
    }
  },
})
