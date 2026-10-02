import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'h-dcf',
  title: 'DCF med terminalværdi',
  course: 'hedgefund',
  topics: ['valuation'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const wacc = rng.int(7, 11) / 100
    const g = rng.int(1, 3) / 100
    const years = d === 1 ? 1 : d === 2 ? 3 : 5
    const fcf0 = rng.int(50, 200)
    const growth = rng.int(3, 12) / 100
    const fcfs = Array.from({ length: years }, (_, i) => Number((fcf0 * (1 + growth) ** (i + 1)).toFixed(1)))
    const tv = (fcfs[years - 1] * (1 + g)) / (wacc - g)
    const pvF = fcfs.reduce((s, f, i) => s + f / (1 + wacc) ** (i + 1), 0)
    const pvTV = tv / (1 + wacc) ** years
    const ev = pvF + pvTV
    const debt = d === 3 ? rng.int(200, 800) : 0
    const shares = d === 3 ? rng.pick([10, 20, 50]) : 1
    const ans = d === 3 ? (ev - debt) / shares : ev
    return {
      prompt: `Forventede frie pengestrømme (mio. kr.): ${fcfs.map((f, i) => `år ${i + 1}: $${tex(f, 1)}$`).join(', ')}. Derefter vokser de med $g = ${tex(g * 100, 0)}\\,\\%$ for evigt. WACC er $${tex(wacc * 100, 0)}\\,\\%$. ${d === 3 ? `Nettogælden er $${debt}$ mio. kr., og der er $${shares}$ mio. aktier. Find værdien pr. aktie (kr., 2 decimaler).` : 'Find virksomhedsværdien (EV) i mio. kr. (2 decimaler).'}`,
      hint: `Terminalværdi i år ${years}: $TV = FCF_{${years}}(1+g)/(WACC - g)$. Diskontér alle pengestrømme og TV til i dag.`,
      solution: `$TV_{${years}} = ${tex(fcfs[years - 1], 1)} \\cdot ${tex(1 + g, 2)}/(${tex(wacc, 2)} - ${tex(g, 2)}) = ${tex(tv, 2)}$.\n\nNutidsværdi af FCF: $${tex(pvF, 2)}$; af TV: $${tex(tv, 2)}/${tex(1 + wacc, 2)}^{${years}} = ${tex(pvTV, 2)}$. EV $= ${tex(ev, 2)}$ mio. kr.${d === 3 ? ` Egenkapital $= ${tex(ev, 2)} - ${debt} = ${tex(ev - debt, 2)}$, pr. aktie $${tex(ans, 2)}$ kr.` : ''} (Bemærk, hvor stor en del af værdien der ligger i TV: $${tex((pvTV / ev) * 100, 1)}\\,\\%$.)\n\nSvar: **${da(ans, 2)}**.`,
      check: { type: 'numeric', answer: Number(ans.toFixed(2)), tolerance: 0.05 },
    }
  },
})
