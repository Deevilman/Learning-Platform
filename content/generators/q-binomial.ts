import { defineGenerator, binom, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-binomial',
  title: 'Binomialfordelingen',
  course: 'quant',
  topics: ['probability'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const n = d === 1 ? rng.int(4, 8) : rng.int(8, 20)
    const p = rng.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.55, 0.6])
    const pmf = (k: number) => binom(n, k) * p ** k * (1 - p) ** (n - k)
    const mid = Math.round(n * p)
    const k = Math.min(n - 1, Math.max(1, rng.int(mid - 2, mid + 2)))
    let ans: number
    let q: string
    let sol: string
    if (d === 1) {
      ans = pmf(k)
      q = `P(X = ${k})`
      sol = `$P(X = ${k}) = \\binom{${n}}{${k}} ${tex(p, 2)}^{${k}} \\cdot ${tex(1 - p, 2)}^{${n - k}} = ${binom(n, k)} \\cdot ${tex(p ** k, 6)} \\cdot ${tex((1 - p) ** (n - k), 6)} = ${tex(ans, 4)}$.`
    } else if (d === 2) {
      ans = Array.from({ length: k + 1 }, (_, i) => pmf(i)).reduce((a, b) => a + b, 0)
      q = `P(X \\le ${k})`
      sol = `$P(X \\le ${k}) = \\sum_{i=0}^{${k}} \\binom{${n}}{i} ${tex(p, 2)}^i ${tex(1 - p, 2)}^{${n} - i} = ${Array.from({ length: k + 1 }, (_, i) => tex(pmf(i), 4)).join(' + ')} = ${tex(ans, 4)}$.`
    } else {
      ans = 1 - Array.from({ length: k }, (_, i) => pmf(i)).reduce((a, b) => a + b, 0)
      q = `P(X \\ge ${k})`
      sol = `Brug komplementet: $P(X \\ge ${k}) = 1 - P(X \\le ${k - 1}) = 1 - (${Array.from({ length: k }, (_, i) => tex(pmf(i), 4)).join(' + ')}) = ${tex(ans, 4)}$.`
    }
    return {
      prompt: `En strategi har uafhængige handler, der hver vinder med sandsynlighed $p = ${tex(p, 2)}$. Lad $X$ være antallet af vindere blandt $n = ${n}$ handler. Beregn $${q}$ (4 decimaler).`,
      hint: '$X \\sim \\mathrm{Bin}(n, p)$ og $P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}$.',
      solution: `${sol}\n\nSvar: **${da(ans, 4)}**.`,
      check: { type: 'numeric', answer: Number(ans.toFixed(4)), tolerance: 0.0006 },
    }
  },
})
