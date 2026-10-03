import { defineGenerator, da, tex, normInv } from '@/lib/generators'

export default defineGenerator({
  id: 'q-confidence-interval',
  title: 'Konfidensinterval og t-statistik',
  course: 'quant',
  topics: ['statistics'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const n = rng.pick([36, 50, 64, 100, 144, 252, 400])
    const xbar = rng.int(-10, 25) / 100
    const s = rng.int(50, 200) / 100
    const se = s / Math.sqrt(n)
    if (d === 3) {
      const t = xbar / se
      return {
        prompt: `En strategi har $n = ${n}$ dagsafkast med gennemsnit $\\bar x = ${tex(xbar, 2)}\\,\\%$ og standardafvigelse $s = ${tex(s, 2)}\\,\\%$. Beregn t-statistikken for $H_0: \\mu = 0$ (3 decimaler). Er afkastet signifikant forskelligt fra 0 på 5 %-niveau (tosidet, $|t| > 1.96$)?`,
        hint: '$t = \\bar x / (s/\\sqrt n)$.',
        solution: `$SE = ${tex(s, 2)}/\\sqrt{${n}} = ${tex(se, 4)}$, $t = ${tex(xbar, 2)}/${tex(se, 4)} = ${tex(t, 3)}$. ${Math.abs(t) > 1.96 ? 'Signifikant på 5 %-niveau' : 'Ikke signifikant på 5 %-niveau'} — og husk: tester man mange strategier, skal grænsen være langt højere (multiple testing).\n\nSvar: **${da(t, 3)}**.`,
        check: { type: 'numeric', answer: Number(t.toFixed(3)), tolerance: 0.005 },
      }
    }
    const level = d === 1 ? 0.95 : rng.pick([0.9, 0.99])
    const z = normInv(1 - (1 - level) / 2)
    const lo = xbar - z * se
    const hi = xbar + z * se
    return {
      prompt: `Stikprøve: $n = ${n}$, $\\bar x = ${tex(xbar, 2)}$, $s = ${tex(s, 2)}$. Find et ${tex(level * 100, 0)} %-konfidensinterval for $\\mu$ (stor stikprøve, normalapproksimation). Angiv nedre og øvre grænse adskilt af semikolon (4 decimaler).`,
      hint: `$\\bar x \\pm z\\,s/\\sqrt n$ med $z = ${tex(z, 3)}$.`,
      solution: `$SE = ${tex(s, 2)}/\\sqrt{${n}} = ${tex(se, 4)}$; $z = ${tex(z, 3)}$. Intervallet er $${tex(xbar, 2)} \\pm ${tex(z * se, 4)} = [${tex(lo, 4)};\\ ${tex(hi, 4)}]$.\n\nSvar: **${da(lo, 4)}; ${da(hi, 4)}**.`,
      check: { type: 'numeric-list', answers: [Number(lo.toFixed(4)), Number(hi.toFixed(4))], tolerance: 0.002 },
    }
  },
})
