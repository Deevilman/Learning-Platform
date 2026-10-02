import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'h-ratios',
  title: 'Sharpe, Sortino og Calmar',
  course: 'hedgefund',
  topics: ['performance'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const rf = rng.int(0, 4) / 100
    const mu = rng.int(5, 18) / 100
    if (d === 1) {
      const sigma = rng.int(6, 25) / 100
      const s = (mu - rf) / sigma
      return {
        prompt: `En fond: årligt afkast $${tex(mu * 100, 0)}\\,\\%$, volatilitet $${tex(sigma * 100, 0)}\\,\\%$, risikofri rente $${tex(rf * 100, 0)}\\,\\%$. Beregn Sharpe ratio (3 decimaler).`,
        hint: '$(\\mu - r_f)/\\sigma$.',
        solution: `$(${tex(mu, 2)} - ${tex(rf, 2)})/${tex(sigma, 2)} = ${tex(s, 3)}$.\n\nSvar: **${da(s, 3)}**.`,
        check: { type: 'numeric', answer: Number(s.toFixed(3)), tolerance: 0.002 },
      }
    }
    if (d === 2) {
      const dd = rng.int(5, 30) / 100
      const c = mu / dd
      return {
        prompt: `En fond har gennemsnitligt årligt afkast (CAGR) $${tex(mu * 100, 0)}\\,\\%$ og maksimalt drawdown $${tex(dd * 100, 0)}\\,\\%$. Beregn Calmar ratio (3 decimaler).`,
        hint: 'Calmar = årligt afkast / |max drawdown|.',
        solution: `$${tex(mu, 2)}/${tex(dd, 2)} = ${tex(c, 3)}$.\n\nSvar: **${da(c, 3)}**.`,
        check: { type: 'numeric', answer: Number(c.toFixed(3)), tolerance: 0.002 },
      }
    }
    // Sortino from a short list of annual returns with target 0
    const rs = Array.from({ length: 6 }, () => rng.int(-15, 25))
    if (!rs.some((r) => r < 0)) rs[rng.int(0, 5)] = -rng.int(2, 10)
    const mean = rs.reduce((a, b) => a + b, 0) / rs.length
    const dd = Math.sqrt(rs.reduce((s, r) => s + Math.min(r, 0) ** 2, 0) / rs.length)
    const sortino = mean / dd
    return {
      prompt: `Årlige afkast (%): ${rs.map((r) => `$${r}$`).join(', ')}. Beregn Sortino ratio med mål 0 (gennemsnit / downside deviation, hvor $DD = \\sqrt{\\frac1n \\sum \\min(r_i, 0)^2}$; 3 decimaler).`,
      hint: 'Kun de negative afkast tæller i nævneren — men divider med alle $n$.',
      solution: `Gennemsnit $= ${tex(mean, 4)}$. $DD = \\sqrt{(${rs.filter((r) => r < 0).map((r) => `${r}^2`).join(' + ')})/${rs.length}} = ${tex(dd, 4)}$. Sortino $= ${tex(mean, 4)}/${tex(dd, 4)} = ${tex(sortino, 3)}$.\n\nSvar: **${da(sortino, 3)}**.`,
      check: { type: 'numeric', answer: Number(sortino.toFixed(3)), tolerance: 0.003 },
    }
  },
})
