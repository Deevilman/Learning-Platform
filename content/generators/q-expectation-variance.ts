import { defineGenerator, da, tex, frac } from '@/lib/generators'

export default defineGenerator({
  id: 'q-expectation-variance',
  title: 'Middelværdi og varians for en diskret fordeling',
  course: 'quant',
  topics: ['probability'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const k = d === 1 ? 3 : 4
    const xs = rng.sample([-20, -10, -5, -2, 0, 1, 2, 3, 5, 8, 10, 15, 20], k).sort((a, b) => a - b)
    // probabilities as multiples of 1/20
    const cuts = rng.sample(Array.from({ length: 19 }, (_, i) => i + 1), k - 1).sort((a, b) => a - b)
    const w = [cuts[0], ...cuts.slice(1).map((c, i) => c - cuts[i]), 20 - cuts[k - 2]]
    const ps = w.map((x) => x / 20)
    const E = xs.reduce((s, x, i) => s + x * ps[i], 0)
    const E2 = xs.reduce((s, x, i) => s + x * x * ps[i], 0)
    const V = E2 - E * E
    const askVar = d >= 2
    const ans = d === 3 ? Math.sqrt(V) : askVar ? V : E
    const table = `| $x$ | ${xs.join(' | ')} |\n|:-:|${xs.map(() => ':-:').join('|')}|\n| $P(X = x)$ | ${w.map((x) => `$${frac(x, 20)}$`).join(' | ')} |`
    const what = d === 3 ? 'standardafvigelsen $\\sigma_X$' : askVar ? 'variansen $\\mathrm{Var}(X)$' : 'middelværdien $E[X]$'
    return {
      prompt: `Gevinsten $X$ (kr.) i et spil har fordelingen\n\n${table}\n\nBeregn ${what} (4 decimaler).`,
      hint: '$E[X] = \\sum x\\,p(x)$ og $\\mathrm{Var}(X) = E[X^2] - E[X]^2$.',
      solution: `$E[X] = ${xs.map((x, i) => `${x < 0 ? `(${x})` : x} \\cdot ${tex(ps[i], 2)}`).join(' + ')} = ${tex(E, 4)}$.${askVar ? `\n\n$E[X^2] = ${tex(E2, 4)}$, så $\\mathrm{Var}(X) = ${tex(E2, 4)} - ${tex(E, 4)}^2 = ${tex(V, 4)}$.` : ''}${d === 3 ? ` $\\sigma_X = \\sqrt{${tex(V, 4)}} = ${tex(ans, 4)}$.` : ''}\n\nSvar: **${da(ans, 4)}**.`,
      check: { type: 'numeric', answer: Number(ans.toFixed(4)), tolerance: 0.0006 },
    }
  },
})
