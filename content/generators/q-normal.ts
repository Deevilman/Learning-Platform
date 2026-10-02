import { defineGenerator, da, tex, normCdf, normInv } from '@/lib/generators'

export default defineGenerator({
  id: 'q-normal',
  title: 'Normalfordelingen',
  course: 'quant',
  topics: ['probability'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const mu = rng.int(-2, 12) / 10
    const sigma = rng.int(5, 30) / 10
    if (d === 3) {
      const p = rng.pick([0.9, 0.95, 0.975, 0.99])
      const z = normInv(p)
      const x = mu + sigma * z
      return {
        prompt: `Et dagligt afkast (i %) er $X \\sim N(${tex(mu, 1)}, ${tex(sigma, 1)}^2)$. Find $x$, så $P(X \\le x) = ${tex(p, 3)}$ (3 decimaler).`,
        hint: 'Find $z = \\Phi^{-1}(p)$ og transformér tilbage: $x = \\mu + \\sigma z$.',
        solution: `$z = \\Phi^{-1}(${tex(p, 3)}) = ${tex(z, 4)}$, så $x = ${tex(mu, 1)} + ${tex(sigma, 1)} \\cdot ${tex(z, 4)} = ${tex(x, 3)}$.\n\nSvar: **${da(x, 3)}**.`,
        check: { type: 'numeric', answer: Number(x.toFixed(3)), tolerance: 0.005 },
      }
    }
    const a = Number((mu + rng.int(-25, 5) / 10).toFixed(1))
    const b = Number((a + rng.int(5, 30) / 10).toFixed(1))
    const za = (a - mu) / sigma
    const zb = (b - mu) / sigma
    const ans = d === 1 ? normCdf(za) : normCdf(zb) - normCdf(za)
    return {
      prompt: `Et dagligt afkast (i %) er $X \\sim N(${tex(mu, 1)}, ${tex(sigma, 1)}^2)$. Beregn ${d === 1 ? `$P(X < ${tex(a, 1)})$` : `$P(${tex(a, 1)} < X < ${tex(b, 1)})$`} (4 decimaler).`,
      hint: 'Standardisér: $Z = (X - \\mu)/\\sigma \\sim N(0,1)$, og brug $\\Phi$.',
      solution:
        d === 1
          ? `$z = (${tex(a, 1)} - ${tex(mu, 1)})/${tex(sigma, 1)} = ${tex(za, 4)}$, og $\\Phi(${tex(za, 4)}) = ${tex(ans, 4)}$.\n\nSvar: **${da(ans, 4)}**.`
          : `$z_a = ${tex(za, 4)}$, $z_b = ${tex(zb, 4)}$. $\\Phi(z_b) - \\Phi(z_a) = ${tex(normCdf(zb), 4)} - ${tex(normCdf(za), 4)} = ${tex(ans, 4)}$.\n\nSvar: **${da(ans, 4)}**.`,
      check: { type: 'numeric', answer: Number(ans.toFixed(4)), tolerance: 0.0015 },
    }
  },
})
