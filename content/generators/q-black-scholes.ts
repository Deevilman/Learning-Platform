import { defineGenerator, da, tex, normCdf } from '@/lib/generators'

export default defineGenerator({
  id: 'q-black-scholes',
  title: 'Black–Scholes: pris og delta',
  course: 'quant',
  topics: ['derivatives', 'stochastic'],
  difficulties: [2, 3],
  make(rng, d) {
    const S = rng.int(80, 120)
    const K = rng.pick([80, 90, 100, 110, 120])
    const r = rng.int(0, 5) / 100
    const sigma = rng.int(15, 45) / 100
    const T = rng.pick([0.25, 0.5, 1])
    const call = rng.chance(0.6)
    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T))
    const d2 = d1 - sigma * Math.sqrt(T)
    const C = S * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2)
    const P = K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1)
    const price = call ? C : P
    const delta = call ? normCdf(d1) : normCdf(d1) - 1
    const askDelta = d === 3
    return {
      prompt: `Black–Scholes: $S_0 = ${S}$, $K = ${K}$, $r = ${tex(r * 100, 0)}\\,\\%$, $\\sigma = ${tex(sigma * 100, 0)}\\,\\%$, $T = ${tex(T, 2)}$ år, ingen udbytte. Find ${askDelta ? `**delta** for en europæisk ${call ? 'call' : 'put'} (4 decimaler)` : `prisen på en europæisk **${call ? 'call' : 'put'}** (2 decimaler)`}.`,
      hint: '$d_1 = \\frac{\\ln(S/K) + (r + \\sigma^2/2)T}{\\sigma\\sqrt T}$, $d_2 = d_1 - \\sigma\\sqrt T$; $C = S\\Phi(d_1) - Ke^{-rT}\\Phi(d_2)$, $\\Delta_C = \\Phi(d_1)$, $\\Delta_P = \\Phi(d_1) - 1$.',
      solution: `$d_1 = ${tex(d1, 4)}$, $d_2 = ${tex(d2, 4)}$, $\\Phi(d_1) = ${tex(normCdf(d1), 4)}$, $\\Phi(d_2) = ${tex(normCdf(d2), 4)}$.\n\nCall: $C = ${S} \\cdot ${tex(normCdf(d1), 4)} - ${K}e^{-${tex(r * T, 4)}} \\cdot ${tex(normCdf(d2), 4)} = ${tex(C, 4)}$. Put (via paritet): $P = ${tex(P, 4)}$. Delta: $${tex(delta, 4)}$.\n\nSvar: **${askDelta ? da(delta, 4) : da(price, 2)}**.`,
      check: askDelta ? { type: 'numeric', answer: Number(delta.toFixed(4)), tolerance: 0.002 } : { type: 'numeric', answer: Number(price.toFixed(2)), tolerance: 0.02 },
    }
  },
})
