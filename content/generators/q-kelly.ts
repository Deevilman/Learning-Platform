import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-kelly',
  title: 'Kelly-kriteriet',
  course: 'quant',
  topics: ['strategies', 'risk-ml'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    if (d < 3) {
      const p = rng.int(51, 70) / 100
      const b = d === 1 ? 1 : rng.pick([0.5, 1.5, 2, 3])
      const f = p - (1 - p) / b
      return {
        prompt: `Et væddemål vinder med sandsynlighed $p = ${tex(p, 2)}$ og betaler $${tex(b, 1)}$ kr. pr. indsat krone ved gevinst (ellers tabes indsatsen). Hvilken andel af formuen skal man ifølge Kelly satse (4 decimaler)?`,
        hint: '$f^* = p - \\dfrac{1-p}{b}$ (maksimerer $E[\\ln(\\text{formue})]$).',
        solution: `$f^* = ${tex(p, 2)} - ${tex(1 - p, 2)}/${tex(b, 1)} = ${tex(f, 4)}$.${f <= 0 ? ' Negativ: lad være med at satse.' : ''}\n\nSvar: **${da(f, 4)}**.`,
        check: { type: 'numeric', answer: Number(f.toFixed(4)), tolerance: 0.001 },
      }
    }
    const mu = rng.int(4, 12) / 100
    const r = rng.int(0, 3) / 100
    const sigma = rng.int(12, 30) / 100
    const f = (mu - r) / (sigma * sigma)
    return {
      prompt: `En kontinuert strategi har forventet afkast $\\mu = ${tex(mu * 100, 0)}\\,\\%$, volatilitet $\\sigma = ${tex(sigma * 100, 0)}\\,\\%$, og den risikofri rente er $${tex(r * 100, 0)}\\,\\%$. Hvad er den Kelly-optimale gearing $f^*$ (4 decimaler)?`,
      hint: 'Vækstraten er $g(f) = r + f(\\mu - r) - \\tfrac12 f^2\\sigma^2$; maksimér i $f$.',
      solution: `$g'(f) = (\\mu - r) - f\\sigma^2 = 0 \\Rightarrow f^* = (${tex(mu, 2)} - ${tex(r, 2)})/${tex(sigma, 2)}^2 = ${tex(f, 4)}$. I praksis bruger man ofte "halv Kelly", fordi $\\mu$ er usikker.\n\nSvar: **${da(f, 4)}**.`,
      check: { type: 'numeric', answer: Number(f.toFixed(4)), tolerance: 0.002 },
    }
  },
})
