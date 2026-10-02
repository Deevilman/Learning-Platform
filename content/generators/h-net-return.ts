import { defineGenerator, da, tex } from '@/lib/generators'

// Week-1 convention: n = g − m − p·max(g − m, 0).
export default defineGenerator({
  id: 'h-net-return',
  title: 'Brutto- og nettoafkast (uge 1-konventionen)',
  course: 'hedgefund',
  topics: ['hf-basics', 'fees-structure'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const m = rng.pick([0.01, 0.015, 0.02])
    const p = rng.pick([0.1, 0.2, 0.25, 0.3])
    if (d === 3) {
      const n = rng.int(3, 10) / 100
      const g = m + n / (1 - p)
      return {
        prompt: `Med forvaltningshonorar $m = ${tex(m * 100, 1)}\\,\\%$ og resultathonorar $p = ${tex(p * 100, 0)}\\,\\%$ (uge 1-konventionen: $n = g - m - p\\max(g - m, 0)$): hvilket bruttoafkast $g$ (i %, 3 decimaler) kræves for et nettoafkast på $${tex(n * 100, 0)}\\,\\%$?`,
        hint: 'For $g > m$ er $n = (g - m)(1 - p)$. Løs for $g$.',
        solution: `$g = m + n/(1-p) = ${tex(m * 100, 1)} + ${tex(n * 100, 0)}/${tex(1 - p, 2)} = ${tex(g * 100, 3)}\\,\\%$.\n\nSvar: **${da(g * 100, 3)} %**.`,
        check: { type: 'numeric', answer: Number((g * 100).toFixed(3)), tolerance: 0.002, unit: '%' },
      }
    }
    const g = rng.int(d === 1 ? 3 : -15, 30) / 100
    const n = g - m - p * Math.max(g - m, 0)
    const share = g > 0 ? (g - n) / g : NaN
    const askShare = d === 2 && g > 0.05
    return {
      prompt: `En hedgefond tjener $${tex(g * 100, 0)}\\,\\%$ brutto. Gebyrer: $${tex(m * 100, 1)}\\,\\%$ af formuen og $${tex(p * 100, 0)}\\,\\%$ af gevinsten efter forvaltningshonorar (uge 1-konventionen, ingen HWM). ${askShare ? 'Hvor stor en andel af bruttogevinsten (i %, 2 decimaler) går til gebyrer?' : 'Hvad er nettoafkastet (i %, 2 decimaler)?'}`,
      hint: '$n = g - m - p\\max(g - m, 0)$.',
      solution: `$n = ${tex(g * 100, 0)} - ${tex(m * 100, 1)} - ${tex(p, 2)} \\cdot \\max(${tex((g - m) * 100, 1)}, 0) = ${tex(n * 100, 2)}\\,\\%$.${askShare ? ` Gebyrerne er $${tex((g - n) * 100, 2)}$ procentpoint, dvs. $${tex(share * 100, 2)}\\,\\%$ af bruttogevinsten.` : ''}\n\nSvar: **${da((askShare ? share : n) * 100, 2)} %**.`,
      check: { type: 'numeric', answer: Number(((askShare ? share : n) * 100).toFixed(2)), tolerance: 0.01, unit: '%' },
    }
  },
})
