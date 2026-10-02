import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-capm',
  title: 'CAPM: beta, forventet afkast og alpha',
  course: 'quant',
  topics: ['portfolio', 'factors'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const rf = rng.int(1, 4) / 100
    const rm = rng.int(6, 12) / 100
    if (d === 1) {
      const beta = rng.int(3, 20) / 10
      const er = rf + beta * (rm - rf)
      return {
        prompt: `$r_f = ${tex(rf * 100, 0)}\\,\\%$, forventet markedsafkast $${tex(rm * 100, 0)}\\,\\%$ og $\\beta = ${tex(beta, 1)}$. Hvad er det forventede afkast ifølge CAPM (i %, 2 decimaler)?`,
        hint: '$E[R_i] = r_f + \\beta_i(E[R_m] - r_f)$.',
        solution: `$E[R] = ${tex(rf * 100, 0)} + ${tex(beta, 1)} \\cdot (${tex(rm * 100, 0)} - ${tex(rf * 100, 0)}) = ${tex(er * 100, 2)}\\,\\%$.\n\nSvar: **${da(er * 100, 2)} %**.`,
        check: { type: 'numeric', answer: Number((er * 100).toFixed(2)), tolerance: 0.01, unit: '%' },
      }
    }
    if (d === 2) {
      const sm = rng.int(12, 22) / 100
      const si = rng.int(15, 45) / 100
      const rho = rng.int(2, 9) / 10
      const beta = (rho * si) / sm
      return {
        prompt: `En aktie har volatilitet $${tex(si * 100, 0)}\\,\\%$, markedet $${tex(sm * 100, 0)}\\,\\%$, og korrelationen mellem dem er $${tex(rho, 1)}$. Beregn aktiens beta (4 decimaler).`,
        hint: '$\\beta = \\mathrm{Cov}(R_i, R_m)/\\mathrm{Var}(R_m) = \\rho\\,\\sigma_i/\\sigma_m$.',
        solution: `$\\beta = ${tex(rho, 1)} \\cdot ${tex(si, 2)}/${tex(sm, 2)} = ${tex(beta, 4)}$.\n\nSvar: **${da(beta, 4)}**.`,
        check: { type: 'numeric', answer: Number(beta.toFixed(4)), tolerance: 0.001 },
      }
    }
    const beta = rng.int(5, 18) / 10
    const real = rng.int(4, 18) / 100
    const alpha = real - (rf + beta * (rm - rf))
    return {
      prompt: `En fond gav $${tex(real * 100, 0)}\\,\\%$ i et år med markedsafkast $${tex(rm * 100, 0)}\\,\\%$ og $r_f = ${tex(rf * 100, 0)}\\,\\%$. Fondens beta er $${tex(beta, 1)}$. Hvad er Jensens alpha (i procentpoint, 2 decimaler)?`,
      hint: '$\\alpha = R_p - [r_f + \\beta(R_m - r_f)]$.',
      solution: `Krævet afkast: $${tex(rf * 100, 0)} + ${tex(beta, 1)} \\cdot ${tex((rm - rf) * 100, 0)} = ${tex((rf + beta * (rm - rf)) * 100, 2)}\\,\\%$. $\\alpha = ${tex(real * 100, 0)} - ${tex((rf + beta * (rm - rf)) * 100, 2)} = ${tex(alpha * 100, 2)}$ procentpoint.\n\nSvar: **${da(alpha * 100, 2)}**.`,
      check: { type: 'numeric', answer: Number((alpha * 100).toFixed(2)), tolerance: 0.01, unit: '%' },
    }
  },
})
