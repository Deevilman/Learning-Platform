import { defineGenerator, da, tex } from '@/lib/generators'

// The plan's week-2 fee engine: M = m·V0, Ṽ = V0(1+g) − M, T = H(1+h),
// I = p·max(Ṽ − T, 0) (hard hurdle), V1 = Ṽ − I, H ← V1 if I > 0.
export default defineGenerator({
  id: 'h-fee-hwm',
  title: 'Gebyrmotoren: 2 og 20 med high-water mark',
  course: 'hedgefund',
  topics: ['fees-structure'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const m = rng.pick([0.01, 0.015, 0.02])
    const p = rng.pick([0.1, 0.15, 0.2, 0.25])
    const h = d === 3 ? rng.pick([0.03, 0.05]) : 0
    const years = d === 1 ? 1 : d === 2 ? 2 : 3
    const gs = Array.from({ length: years }, (_, i) => (i === 0 && years > 1 ? rng.int(-25, -5) : rng.int(-5, 30)) / 100)
    let V = 100
    let H = 100
    const rows: string[] = []
    let lastI = 0
    for (const g of gs) {
      const M = m * V
      const Vt = V * (1 + g) - M
      const T = H * (1 + h)
      const I = p * Math.max(Vt - T, 0)
      rows.push(`| ${tex(g * 100, 0)} % | ${tex(V, 3)} | ${tex(M, 3)} | ${tex(Vt, 3)} | ${tex(T, 3)} | ${tex(I, 3)} | ${tex(Vt - I, 3)} |`)
      V = Vt - I
      if (I > 0) H = V
      lastI = I
    }
    const askFee = d !== 2 || rng.chance(0.5)
    const ans = askFee ? lastI : V
    return {
      prompt: `En fond starter med NAV $V_0 = H = 100$ pr. andel og tager $${tex(m * 100, 1)}\\,\\%$ forvaltningshonorar og $${tex(p * 100, 0)}\\,\\%$ resultathonorar med high-water mark${h ? ` og hard hurdle $h = ${tex(h * 100, 0)}\\,\\%$` : ''} (planens uge 2-konvention: $M = mV_0$, $\\tilde V = V_0(1+g) - M$, $T = H(1+h)$, $I = p\\max(\\tilde V - T, 0)$, $V_1 = \\tilde V - I$, og $H \\leftarrow V_1$ hvis $I > 0$). Bruttoafkastene er ${gs.map((g) => `$${tex(g * 100, 0)}\\,\\%$`).join(', ')}. ${askFee ? `Hvor stort er resultathonoraret $I$ i år ${years}` : `Hvad er NAV efter år ${years}`} (3 decimaler)?`,
      hint: 'Regn ét år ad gangen. Et tab skal tjenes hjem (over $H$) før der igen betales resultathonorar.',
      solution: `| $g$ | $V_0$ | $M$ | $\\tilde V$ | $T$ | $I$ | $V_1$ |\n|:-:|:-:|:-:|:-:|:-:|:-:|:-:|\n${rows.join('\n')}\n\nSvar: **${da(ans, 3)}**.`,
      check: { type: 'numeric', answer: Number(ans.toFixed(3)), tolerance: 0.002 },
    }
  },
})
