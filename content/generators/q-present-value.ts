import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-present-value',
  title: 'Nutidsværdi: annuitet og voksende perpetuitet',
  course: 'quant',
  topics: ['time-value'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const r = rng.int(3, 10) / 100
    if (d === 1) {
      const C = rng.pick([100, 500, 1000, 2500])
      const n = rng.int(2, 6)
      const pv = C / (1 + r) ** n
      return {
        prompt: `Hvad er nutidsværdien af $${tex(C, 0)}$ kr., der udbetales om $${n}$ år, når diskonteringsrenten er $${tex(r * 100, 0)}\\,\\%$? (2 decimaler)`,
        hint: '$PV = C/(1+r)^n$.',
        solution: `$PV = ${tex(C, 0)} / ${tex(1 + r, 2)}^{${n}} = ${tex(pv, 2)}$ kr.\n\nSvar: **${da(pv, 2)}** kr.`,
        check: { type: 'numeric', answer: Number(pv.toFixed(2)), tolerance: 0.02 },
      }
    }
    if (d === 2) {
      const C = rng.pick([1000, 2000, 5000, 12000])
      const n = rng.int(5, 30)
      const pv = (C * (1 - (1 + r) ** -n)) / r
      return {
        prompt: `En annuitet betaler $${tex(C, 0)}$ kr. i slutningen af hvert år i $${n}$ år. Find nutidsværdien ved $r = ${tex(r * 100, 0)}\\,\\%$. (2 decimaler)`,
        hint: '$PV = C\\,\\frac{1-(1+r)^{-n}}{r}$ (geometrisk sum).',
        solution: `$PV = ${tex(C, 0)} \\cdot \\frac{1 - ${tex(1 + r, 2)}^{-${n}}}{${tex(r, 2)}} = ${tex(pv, 2)}$ kr.\n\nSvar: **${da(pv, 2)}** kr.`,
        check: { type: 'numeric', answer: Number(pv.toFixed(2)), tolerance: 0.05 },
      }
    }
    const D = rng.int(2, 20)
    const g = rng.int(0, Math.round(r * 100) - 1) / 100
    const price = D / (r - g)
    return {
      prompt: `En aktie forventes at betale udbytte $${D}$ kr. om ét år, og udbyttet vokser derefter med $g = ${tex(g * 100, 0)}\\,\\%$ om året for evigt. Afkastkravet er $r = ${tex(r * 100, 0)}\\,\\%$. Hvad er prisen ifølge Gordons vækstmodel? (2 decimaler)`,
      hint: '$P_0 = D_1/(r - g)$ for $g < r$.',
      solution: `$P_0 = ${D} / (${tex(r, 2)} - ${tex(g, 2)}) = ${tex(price, 2)}$ kr. Bemærk følsomheden: nævneren $r - g$ er lille, så små ændringer i $r$ eller $g$ flytter prisen meget.\n\nSvar: **${da(price, 2)}** kr.`,
      check: { type: 'numeric', answer: Number(price.toFixed(2)), tolerance: 0.02 },
    }
  },
})
