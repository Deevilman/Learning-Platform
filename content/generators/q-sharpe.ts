import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-sharpe',
  title: 'Sharpe ratio og annualisering',
  course: 'quant',
  topics: ['returns-risk'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const rf = rng.int(0, 4) / 100
    if (d === 1) {
      const mu = rng.int(4, 15) / 100
      const sigma = rng.int(8, 30) / 100
      const s = (mu - rf) / sigma
      return {
        prompt: `En strategi har forventet årligt afkast $${tex(mu * 100, 0)}\\,\\%$ og årlig volatilitet $${tex(sigma * 100, 0)}\\,\\%$. Den risikofri rente er $${tex(rf * 100, 0)}\\,\\%$. Beregn Sharpe ratio (3 decimaler).`,
        hint: '$SR = (\\mu - r_f)/\\sigma$.',
        solution: `$SR = (${tex(mu, 2)} - ${tex(rf, 2)}) / ${tex(sigma, 2)} = ${tex(s, 3)}$.\n\nSvar: **${da(s, 3)}**.`,
        check: { type: 'numeric', answer: Number(s.toFixed(3)), tolerance: 0.002 },
      }
    }
    const freq = d === 2 ? 12 : 252
    const unit = d === 2 ? 'måned' : 'dag'
    const mu = d === 2 ? rng.int(3, 15) / 1000 : rng.int(2, 12) / 10000
    const sd = d === 2 ? rng.int(20, 60) / 1000 : rng.int(5, 20) / 1000
    const rfp = rf / freq
    const s = ((mu - rfp) / sd) * Math.sqrt(freq)
    return {
      prompt: `Gennemsnitligt afkast pr. ${unit}: $${tex(mu * 100, 2)}\\,\\%$; standardafvigelse pr. ${unit}: $${tex(sd * 100, 2)}\\,\\%$; risikofri rente $${tex(rf * 100, 0)}\\,\\%$ p.a. Find den **annualiserede** Sharpe ratio (antag uafhængige afkast, ${freq} perioder pr. år; 3 decimaler).`,
      hint: `Middelværdien skaleres med $${freq}$, standardafvigelsen med $\\sqrt{${freq}}$, så $SR_{\\text{år}} = SR_{\\text{periode}} \\cdot \\sqrt{${freq}}$.`,
      solution: `Risikofri rente pr. ${unit}: $${tex(rf, 2)}/${freq} = ${tex(rfp * 100, 5)}\\,\\%$. $SR_{\\text{${unit}}} = (${tex(mu * 100, 3)} - ${tex(rfp * 100, 5)}) / ${tex(sd * 100, 2)} = ${tex((mu - rfp) / sd, 4)}$. Annualiseret: $\\cdot \\sqrt{${freq}} = ${tex(s, 3)}$.\n\nSvar: **${da(s, 3)}**.`,
      check: { type: 'numeric', answer: Number(s.toFixed(3)), tolerance: 0.005 },
    }
  },
})
