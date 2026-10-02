import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-portfolio-variance',
  title: 'Porteføljens volatilitet og minimum-varians',
  course: 'quant',
  topics: ['portfolio'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const s1 = rng.int(10, 30) / 100
    const s2 = rng.int(5, 25) / 100
    const rho = rng.pick([-0.5, -0.2, 0, 0.2, 0.3, 0.5, 0.8])
    if (d === 3) {
      const cov = rho * s1 * s2
      const w = (s2 * s2 - cov) / (s1 * s1 + s2 * s2 - 2 * cov)
      return {
        prompt: `To aktiver har volatiliteter $\\sigma_1 = ${tex(s1 * 100, 0)}\\,\\%$ og $\\sigma_2 = ${tex(s2 * 100, 0)}\\,\\%$ og korrelation $\\rho = ${tex(rho, 1)}$. Find vægten $w_1$ i minimum-varians-porteføljen (4 decimaler; $w_2 = 1 - w_1$).`,
        hint: '$w_1^* = \\dfrac{\\sigma_2^2 - \\sigma_{12}}{\\sigma_1^2 + \\sigma_2^2 - 2\\sigma_{12}}$ med $\\sigma_{12} = \\rho\\sigma_1\\sigma_2$ (sæt den afledte af variansen lig 0).',
        solution: `$\\sigma_{12} = ${tex(rho, 1)} \\cdot ${tex(s1, 2)} \\cdot ${tex(s2, 2)} = ${tex(cov, 4)}$. $w_1^* = \\frac{${tex(s2 * s2, 4)} - ${tex(cov, 4)}}{${tex(s1 * s1, 4)} + ${tex(s2 * s2, 4)} - 2 \\cdot ${tex(cov, 4)}} = ${tex(w, 4)}$.\n\nSvar: **${da(w, 4)}**.`,
        check: { type: 'numeric', answer: Number(w.toFixed(4)), tolerance: 0.001 },
      }
    }
    const w1 = rng.int(1, 9) / 10
    const w2 = 1 - w1
    const v = w1 * w1 * s1 * s1 + w2 * w2 * s2 * s2 + 2 * w1 * w2 * rho * s1 * s2
    const sp = Math.sqrt(v)
    const ans = d === 1 ? v : sp
    return {
      prompt: `En portefølje har $${tex(w1 * 100, 0)}\\,\\%$ i aktiv 1 ($\\sigma_1 = ${tex(s1 * 100, 0)}\\,\\%$) og $${tex(w2 * 100, 0)}\\,\\%$ i aktiv 2 ($\\sigma_2 = ${tex(s2 * 100, 0)}\\,\\%$), korrelation $\\rho = ${tex(rho, 1)}$. Beregn porteføljens ${d === 1 ? '**varians** (som decimaltal, 6 decimaler)' : '**volatilitet** i % (4 decimaler)'}.`,
      hint: '$\\sigma_p^2 = w_1^2\\sigma_1^2 + w_2^2\\sigma_2^2 + 2w_1w_2\\rho\\sigma_1\\sigma_2$.',
      solution: `$\\sigma_p^2 = ${tex(w1, 1)}^2 \\cdot ${tex(s1, 2)}^2 + ${tex(w2, 1)}^2 \\cdot ${tex(s2, 2)}^2 + 2 \\cdot ${tex(w1, 1)} \\cdot ${tex(w2, 1)} \\cdot ${tex(rho, 1)} \\cdot ${tex(s1, 2)} \\cdot ${tex(s2, 2)} = ${tex(v, 6)}$${d === 2 ? `, så $\\sigma_p = ${tex(sp * 100, 4)}\\,\\%$` : ''}.\n\nSvar: **${d === 1 ? da(v, 6) : `${da(sp * 100, 4)} %`}**.`,
      check: d === 1 ? { type: 'numeric', answer: Number(v.toFixed(6)), tolerance: 0.000002 } : { type: 'numeric', answer: Number((ans * 100).toFixed(4)), tolerance: 0.002, unit: '%' },
    }
  },
})
