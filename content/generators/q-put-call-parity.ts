import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-put-call-parity',
  title: 'Put–call-paritet og forwardpris',
  course: 'quant',
  topics: ['derivatives'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const S = rng.int(80, 120)
    const K = rng.pick([80, 90, 95, 100, 105, 110, 120])
    const r = rng.int(1, 6) / 100
    const T = rng.pick([0.25, 0.5, 1, 2])
    const disc = Math.exp(-r * T)
    if (d === 1) {
      const F = S * Math.exp(r * T)
      return {
        prompt: `En aktie uden udbytte koster $S_0 = ${S}$. Den kontinuerte risikofri rente er $${tex(r * 100, 0)}\\,\\%$. Hvad er no-arbitrage-forwardprisen for levering om $T = ${tex(T, 2)}$ år? (4 decimaler)`,
        hint: 'Cash and carry: lån $S_0$, køb aktien, lever om $T$ år: $F_0 = S_0 e^{rT}$.',
        solution: `$F_0 = ${S}\\,e^{${tex(r, 2)} \\cdot ${tex(T, 2)}} = ${tex(F, 4)}$.\n\nSvar: **${da(F, 4)}**.`,
        check: { type: 'numeric', answer: Number(F.toFixed(4)), tolerance: 0.002 },
      }
    }
    // Round the quoted prices first so the answer follows from the numbers shown.
    const C = Number((Math.max(S - K * disc, 0) + rng.int(10, 80) / 10).toFixed(2))
    const P = C - S + K * disc
    if (d === 2)
      return {
        prompt: `Europæisk call: $C = ${tex(C, 2)}$, $S_0 = ${S}$, $K = ${K}$, $r = ${tex(r * 100, 0)}\\,\\%$ (kontinuert), $T = ${tex(T, 2)}$. Hvad skal den europæiske put med samme $K$ og $T$ koste? (4 decimaler)`,
        hint: '$C - P = S_0 - K e^{-rT}$.',
        solution: `$P = C - S_0 + K e^{-rT} = ${tex(C, 2)} - ${S} + ${K} \\cdot ${tex(disc, 6)} = ${tex(P, 4)}$.\n\nSvar: **${da(P, 4)}**.`,
        check: { type: 'numeric', answer: Number(P.toFixed(4)), tolerance: 0.002 },
      }
    const Pm = Number((P + (rng.pick([-1, 1]) * rng.int(5, 20)) / 10).toFixed(2))
    const profit = Math.abs(Pm - P)
    return {
      prompt: `Markedet: call $C = ${tex(C, 2)}$, put $P = ${tex(Pm, 2)}$, $S_0 = ${S}$, $K = ${K}$, $r = ${tex(r * 100, 0)}\\,\\%$, $T = ${tex(T, 2)}$. Hvor stor en risikofri arbitragegevinst (i dagens kroner, 4 decimaler) kan man låse fast pr. sæt?`,
      hint: 'Sammenlign $C - P$ med $S_0 - Ke^{-rT}$. Køb den billige side og sælg den dyre.',
      solution: `Paritetsprisen for putten er $${tex(P, 4)}$, men markedet siger $${tex(Pm, 2)}$. ${Pm > P ? 'Putten er for dyr: sælg put, køb call, sælg aktien short og indsæt $Ke^{-rT}$.' : 'Putten er for billig: køb put, sælg call, køb aktien og lån $Ke^{-rT}$.'} Gevinsten i dag er $|${tex(Pm, 2)} - ${tex(P, 4)}| = ${tex(profit, 4)}$, og ved udløb går positionerne i nul.\n\nSvar: **${da(profit, 4)}**.`,
      check: { type: 'numeric', answer: Number(profit.toFixed(4)), tolerance: 0.002 },
    }
  },
})
