import { defineGenerator, da, tex, normInv } from '@/lib/generators'

export default defineGenerator({
  id: 'q-var-es',
  title: 'Value at Risk og Expected Shortfall (normal)',
  course: 'quant',
  topics: ['risk-ml'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const V = rng.pick([1, 5, 10, 50]) // mio. kr.
    const sigmaA = rng.int(10, 35) / 100
    const level = rng.pick([0.95, 0.99])
    const days = d === 1 ? 1 : rng.pick([1, 10])
    const sigma = sigmaA * Math.sqrt(days / 252)
    const z = normInv(level)
    const VaR = V * z * sigma
    const phi = Math.exp(-(z * z) / 2) / Math.sqrt(2 * Math.PI)
    const ES = (V * sigma * phi) / (1 - level)
    const askES = d === 3
    return {
      prompt: `En portefølje på $${V}$ mio. kr. har årlig volatilitet $${tex(sigmaA * 100, 0)}\\,\\%$. Antag normalfordelte afkast med middelværdi 0 og 252 handelsdage. Find ${askES ? '**Expected Shortfall**' : '**Value at Risk**'} på $${tex(level * 100, 0)}\\,\\%$-niveau over $${days}$ dag${days > 1 ? 'e' : ''} (i mio. kr., 4 decimaler).`,
      hint: askES ? '$ES_\\alpha = V\\sigma\\,\\varphi(z_\\alpha)/(1-\\alpha)$, hvor $\\varphi$ er standardnormalens tæthed.' : '$VaR_\\alpha = V\\,z_\\alpha\\,\\sigma_h$ med $\\sigma_h = \\sigma_{\\text{år}}\\sqrt{h/252}$.',
      solution: `$\\sigma_h = ${tex(sigmaA, 2)}\\sqrt{${days}/252} = ${tex(sigma, 5)}$, $z = ${tex(z, 4)}$. VaR $= ${V} \\cdot ${tex(z, 4)} \\cdot ${tex(sigma, 5)} = ${tex(VaR, 4)}$. ES $= ${V} \\cdot ${tex(sigma, 5)} \\cdot ${tex(phi, 4)}/${tex(1 - level, 2)} = ${tex(ES, 4)}$ (ES er altid ≥ VaR: den ser på gennemsnittet af halen).\n\nSvar: **${da(askES ? ES : VaR, 4)}** mio. kr.`,
      check: { type: 'numeric', answer: Number((askES ? ES : VaR).toFixed(4)), tolerance: 0.002 },
    }
  },
})
