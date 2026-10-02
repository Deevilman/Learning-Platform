import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-garch',
  title: 'GARCH(1,1): langsigtet volatilitet og prognose',
  course: 'quant',
  topics: ['timeseries', 'risk-ml'],
  difficulties: [2, 3],
  make(rng, d) {
    const alpha = rng.pick([0.05, 0.08, 0.1, 0.12])
    const beta = rng.pick([0.8, 0.85, 0.88, 0.9].filter((b) => alpha + b <= 0.98))
    const omega = rng.pick([0.000002, 0.000005, 0.00001])
    const vL = omega / (1 - alpha - beta)
    const annual = Math.sqrt(252 * vL)
    if (d === 2)
      return {
        prompt: `En GARCH(1,1) for daglige afkast har $\\omega = ${tex(omega * 1e6, 0)} \\cdot 10^{-6}$, $\\alpha = ${tex(alpha, 2)}$, $\\beta = ${tex(beta, 2)}$. Find den langsigtede **årlige** volatilitet i % (252 handelsdage; 2 decimaler).`,
        hint: '$\\sigma_L^2 = \\omega/(1 - \\alpha - \\beta)$ pr. dag; gang med 252 og tag kvadratroden.',
        solution: `$\\sigma_L^2 = ${tex(omega * 1e6, 0)} \\cdot 10^{-6}/(1 - ${tex(alpha + beta, 2)}) = ${tex(vL * 1e6, 4)} \\cdot 10^{-6}$ pr. dag. Årligt: $\\sqrt{252 \\cdot \\sigma_L^2} = ${tex(annual * 100, 2)}\\,\\%$.\n\nSvar: **${da(annual * 100, 2)} %**.`,
        check: { type: 'numeric', answer: Number((annual * 100).toFixed(2)), tolerance: 0.02, unit: '%' },
      }
    const sigToday = rng.int(10, 30) / 1000
    const h = rng.int(2, 20)
    const pers = alpha + beta
    const var1 = sigToday * sigToday // assume tomorrow's variance is known (σ²_{t+1})
    const varH = vL + pers ** (h - 1) * (var1 - vL)
    return {
      prompt: `GARCH(1,1) med $\\omega = ${tex(omega * 1e6, 0)} \\cdot 10^{-6}$, $\\alpha = ${tex(alpha, 2)}$, $\\beta = ${tex(beta, 2)}$. Morgendagens varians er $\\sigma^2_{t+1} = (${tex(sigToday * 100, 1)}\\,\\%)^2$. Find prognosen for den daglige volatilitet om $${h}$ dage, $\\sqrt{E_t[\\sigma^2_{t+${h}}]}$, i % (3 decimaler).`,
      hint: '$E_t[\\sigma^2_{t+h}] = \\sigma_L^2 + (\\alpha+\\beta)^{h-1}(\\sigma^2_{t+1} - \\sigma_L^2)$.',
      solution: `$\\sigma_L^2 = ${tex(vL * 1e6, 4)} \\cdot 10^{-6}$, persistens $\\alpha + \\beta = ${tex(pers, 2)}$. $E_t[\\sigma^2_{t+${h}}] = ${tex(vL * 1e6, 4)} \\cdot 10^{-6} + ${tex(pers, 2)}^{${h - 1}}(${tex(var1 * 1e6, 2)} - ${tex(vL * 1e6, 4)}) \\cdot 10^{-6} = ${tex(varH * 1e6, 4)} \\cdot 10^{-6}$, så volatiliteten er $${tex(Math.sqrt(varH) * 100, 3)}\\,\\%$.\n\nSvar: **${da(Math.sqrt(varH) * 100, 3)} %**.`,
      check: { type: 'numeric', answer: Number((Math.sqrt(varH) * 100).toFixed(3)), tolerance: 0.003, unit: '%' },
    }
  },
})
