import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-compound-interest',
  title: 'Rentes rente: diskret og kontinuert',
  course: 'quant',
  topics: ['time-value'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const P = rng.pick([1000, 5000, 10000, 25000, 100000])
    const r = rng.int(1, 12) / 100
    const T = rng.int(2, 30)
    if (d === 1) {
      const fv = P * (1 + r) ** T
      return {
        prompt: `Du indsætter $${tex(P, 0)}$ kr. til $${tex(r * 100, 0)}\\,\\%$ årlig rente (tilskrevet én gang om året). Hvad står der på kontoen efter $${T}$ år? (Angiv i kr., 2 decimaler.)`,
        hint: '$FV = P(1+r)^T$.',
        solution: `$FV = ${tex(P, 0)} \\cdot ${tex(1 + r, 2)}^{${T}} = ${tex(fv, 2)}$ kr.\n\nSvar: **${da(fv, 2)}** kr.`,
        check: { type: 'numeric', answer: Number(fv.toFixed(2)), tolerance: 0.02, unit: 'kr.' },
      }
    }
    if (d === 2) {
      const m = rng.pick([2, 4, 12, 365])
      const fv = P * (1 + r / m) ** (m * T)
      const ear = (1 + r / m) ** m - 1
      return {
        prompt: `Nominel rente $${tex(r * 100, 0)}\\,\\%$ p.a. tilskrives $${m}$ gange om året. Hvad vokser $${tex(P, 0)}$ kr. til på $${T}$ år? (2 decimaler)`,
        hint: '$FV = P(1 + r/m)^{mT}$. Den effektive årlige rente er $(1+r/m)^m - 1$.',
        solution: `$FV = ${tex(P, 0)}\\,(1 + ${tex(r, 2)}/${m})^{${m * T}} = ${tex(fv, 2)}$ kr. (Effektiv årlig rente: $${tex(ear * 100, 4)}\\,\\%$.)\n\nSvar: **${da(fv, 2)}** kr.`,
        check: { type: 'numeric', answer: Number(fv.toFixed(2)), tolerance: 0.05, unit: 'kr.' },
      }
    }
    const target = rng.pick([2, 3, 10])
    const t = Math.log(target) / r
    return {
      prompt: `Med kontinuert forrentning $P e^{rt}$ og $r = ${tex(r * 100, 0)}\\,\\%$: hvor mange år tager det for et beløb at blive ${target === 2 ? 'fordoblet' : target === 3 ? 'tredoblet' : 'tidoblet'}? (2 decimaler)`,
      hint: 'Løs $e^{rt} = k$, dvs. $t = \\ln k / r$. (Tommelfingerregel for fordobling: $69/(100r)$.)',
      solution: `$t = \\ln ${target} / ${tex(r, 2)} = ${tex(Math.log(target), 4)} / ${tex(r, 2)} = ${tex(t, 2)}$ år.\n\nSvar: **${da(t, 2)}** år.`,
      check: { type: 'numeric', answer: Number(t.toFixed(2)), tolerance: 0.02, unit: 'år' },
    }
  },
})
