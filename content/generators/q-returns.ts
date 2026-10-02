import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-returns',
  title: 'Simple afkast og log-afkast',
  course: 'quant',
  topics: ['returns-risk'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const n = d === 1 ? 2 : d === 2 ? 4 : 5
    const P = [rng.int(80, 120)]
    for (let i = 1; i < n; i++) P.push(Math.max(10, Math.round(P[i - 1] * (1 + rng.real(-0.12, 0.14, 3)))))
    const prices = P.map((p) => tex(p, 0)).join(',\\ ')
    if (d === 1) {
      const R = P[1] / P[0] - 1
      const r = Math.log(P[1] / P[0])
      const askLog = rng.chance(0.5)
      const ans = askLog ? r : R
      return {
        prompt: `En aktie går fra $${P[0]}$ til $${P[1]}$ kr. Beregn ${askLog ? '**log-afkastet** $r = \\ln(P_1/P_0)$' : 'det **simple afkast** $R = P_1/P_0 - 1$'} i procent (4 decimaler).`,
        hint: 'Simpelt afkast: $P_1/P_0 - 1$. Log-afkast: $\\ln(P_1/P_0) = \\ln(1+R)$.',
        solution: `$R = ${P[1]}/${P[0]} - 1 = ${tex(R * 100, 4)}\\,\\%$ og $r = \\ln(${P[1]}/${P[0]}) = ${tex(r * 100, 4)}\\,\\%$.\n\nSvar: **${da(ans * 100, 4)} %**.`,
        check: { type: 'numeric', answer: Number((ans * 100).toFixed(4)), tolerance: 0.001, unit: '%' },
      }
    }
    if (d === 2) {
      const logs = P.slice(1).map((p, i) => Math.log(p / P[i]))
      const total = logs.reduce((a, b) => a + b, 0)
      return {
        prompt: `Lukkekurser: $${prices}$. Beregn det samlede **log-afkast** over hele perioden i procent (4 decimaler).`,
        hint: 'Log-afkast lægges sammen over tid: $\\sum_t \\ln(P_t/P_{t-1}) = \\ln(P_T/P_0)$.',
        solution: `De enkelte log-afkast er ${logs.map((l) => `$${tex(l * 100, 4)}\\,\\%$`).join(', ')}. Summen teleskoperer: $\\ln(${P[n - 1]}/${P[0]}) = ${tex(total * 100, 4)}\\,\\%$.\n\nSvar: **${da(total * 100, 4)} %**.`,
        check: { type: 'numeric', answer: Number((total * 100).toFixed(4)), tolerance: 0.001, unit: '%' },
      }
    }
    const simple = P.slice(1).map((p, i) => p / P[i] - 1)
    const arith = simple.reduce((a, b) => a + b, 0) / simple.length
    const geo = (P[n - 1] / P[0]) ** (1 / simple.length) - 1
    return {
      prompt: `Lukkekurser: $${prices}$. Find det **geometriske** gennemsnitlige afkast pr. periode i procent (4 decimaler), og sammenlign med det aritmetiske.`,
      hint: 'Geometrisk: $(P_T/P_0)^{1/T} - 1$. Det er altid ≤ det aritmetiske gennemsnit (AM–GM).',
      solution: `Simple afkast: ${simple.map((x) => `$${tex(x * 100, 2)}\\,\\%$`).join(', ')}. Aritmetisk gennemsnit $${tex(arith * 100, 4)}\\,\\%$. Geometrisk: $(${P[n - 1]}/${P[0]})^{1/${simple.length}} - 1 = ${tex(geo * 100, 4)}\\,\\%$ — det er det afkast, der faktisk forklarer slutværdien.\n\nSvar: **${da(geo * 100, 4)} %**.`,
      check: { type: 'numeric', answer: Number((geo * 100).toFixed(4)), tolerance: 0.001, unit: '%' },
    }
  },
})
