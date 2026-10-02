import { defineGenerator, da, tex } from '@/lib/generators'

const CONTEXTS = [
  { what: 'en sjælden sygdom', test: 'en test', pos: 'positiv' },
  { what: 'svindel i en transaktion', test: 'et svindelfilter', pos: 'alarm' },
  { what: 'at en strategi har ægte edge', test: 'en backtest med Sharpe > 1', pos: 'bestået' },
  { what: 'en defekt komponent', test: 'en kvalitetskontrol', pos: 'fejlmelding' },
]

export default defineGenerator({
  id: 'q-bayes',
  title: 'Bayes’ formel',
  course: 'quant',
  topics: ['probability'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const c = rng.pick(CONTEXTS)
    const prior = d === 1 ? rng.pick([0.1, 0.2, 0.3]) : rng.pick([0.001, 0.005, 0.01, 0.02, 0.05])
    const sens = rng.pick([0.8, 0.9, 0.95, 0.99])
    const spec = rng.pick([0.9, 0.95, 0.98, 0.99])
    const pPos = sens * prior + (1 - spec) * (1 - prior)
    let post = (sens * prior) / pPos
    let extra = ''
    if (d === 3) {
      // two independent positive results
      const p2 = sens ** 2 * prior + (1 - spec) ** 2 * (1 - prior)
      post = (sens ** 2 * prior) / p2
      extra = ' Resultatet er **to uafhængige** positive udfald i træk.'
    }
    return {
      prompt: `Grundraten for ${c.what} er $${tex(prior * 100, 2)}\\,\\%$. ${c.test[0].toUpperCase() + c.test.slice(1)} giver "${c.pos}" med sandsynlighed $${tex(sens * 100, 0)}\\,\\%$, når det er tilfældet (sensitivitet), og "ikke ${c.pos}" med sandsynlighed $${tex(spec * 100, 0)}\\,\\%$, når det ikke er (specificitet).${extra} Hvad er sandsynligheden (i %, 2 decimaler) for ${c.what}, givet ${d === 3 ? 'to' : 'et'} "${c.pos}"?`,
      hint: '$P(H \\mid +) = \\dfrac{P(+ \\mid H) P(H)}{P(+ \\mid H) P(H) + P(+ \\mid \\neg H) P(\\neg H)}$. Tænk evt. i 10.000 tilfælde.',
      solution:
        d === 3
          ? `To uafhængige udfald: $P(++ \\mid H) = ${tex(sens, 2)}^2$, $P(++ \\mid \\neg H) = ${tex(1 - spec, 2)}^2$.\n\n$$P(H \\mid ++) = \\frac{${tex(sens, 2)}^2 \\cdot ${tex(prior, 3)}}{${tex(sens, 2)}^2 \\cdot ${tex(prior, 3)} + ${tex(1 - spec, 2)}^2 \\cdot ${tex(1 - prior, 3)}} = ${tex(post * 100, 2)}\\,\\%.$$\n\nSvar: **${da(post * 100, 2)} %**.`
          : `$$P(H \\mid +) = \\frac{${tex(sens, 2)} \\cdot ${tex(prior, 3)}}{${tex(sens, 2)} \\cdot ${tex(prior, 3)} + ${tex(1 - spec, 2)} \\cdot ${tex(1 - prior, 3)}} = \\frac{${tex(sens * prior, 5)}}{${tex(pPos, 5)}} = ${tex(post * 100, 2)}\\,\\%.$$\n\nI 10.000 tilfælde: $${tex(10000 * prior * sens, 1)}$ sande positive mod $${tex(10000 * (1 - prior) * (1 - spec), 1)}$ falske positive. Svar: **${da(post * 100, 2)} %**.`,
      check: { type: 'numeric', answer: Number((post * 100).toFixed(2)), tolerance: 0.02, unit: '%' },
    }
  },
})
