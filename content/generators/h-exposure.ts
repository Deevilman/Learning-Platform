import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'h-exposure',
  title: 'Brutto- og nettoeksponering, gearing',
  course: 'hedgefund',
  topics: ['long-short', 'risk-leverage'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const nav = rng.pick([100, 200, 500, 1000])
    const L = Math.round(nav * rng.real(0.8, 2.2, 2))
    const S = Math.round(nav * rng.real(0.3, 1.8, 2))
    const gross = ((L + S) / nav) * 100
    const net = ((L - S) / nav) * 100
    if (d === 1) {
      const askGross = rng.chance(0.5)
      return {
        prompt: `En long/short-fond med NAV $${nav}$ mio. kr. har $${L}$ mio. i long-positioner og $${S}$ mio. i short-positioner. Hvad er ${askGross ? 'bruttoeksponeringen' : 'nettoeksponeringen'} i % af NAV (2 decimaler)?`,
        hint: 'Brutto = (long + short)/NAV. Netto = (long − short)/NAV.',
        solution: `Brutto $= (${L} + ${S})/${nav} = ${tex(gross, 2)}\\,\\%$, netto $= (${L} - ${S})/${nav} = ${tex(net, 2)}\\,\\%$.\n\nSvar: **${da(askGross ? gross : net, 2)} %**.`,
        check: { type: 'numeric', answer: Number((askGross ? gross : net).toFixed(2)), tolerance: 0.01, unit: '%' },
      }
    }
    const bl = rng.int(8, 13) / 10
    const bs = rng.int(6, 14) / 10
    const betaAdj = ((L * bl - S * bs) / nav) * 100
    if (d === 2)
      return {
        prompt: `NAV $${nav}$, long $${L}$ (gns. beta $${tex(bl, 1)}$), short $${S}$ (gns. beta $${tex(bs, 1)}$), alle i mio. kr. Find den **beta-justerede** nettoeksponering i % af NAV (2 decimaler).`,
        hint: 'Beta-justeret netto = (long·β_L − short·β_S)/NAV.',
        solution: `$(${L} \\cdot ${tex(bl, 1)} - ${S} \\cdot ${tex(bs, 1)})/${nav} = ${tex(betaAdj, 2)}\\,\\%$ (rå netto: $${tex(net, 2)}\\,\\%$).\n\nSvar: **${da(betaAdj, 2)} %**.`,
        check: { type: 'numeric', answer: Number(betaAdj.toFixed(2)), tolerance: 0.01, unit: '%' },
      }
    const mL = rng.int(-10, 10) / 100
    const mS = rng.int(-10, 10) / 100
    const pnl = (L * mL - S * mS) / nav * 100
    return {
      prompt: `NAV $${nav}$, long $${L}$, short $${S}$ (mio. kr.). I en måned stiger long-bogen $${tex(mL * 100, 0)}\\,\\%$ og short-bogen (de shortede aktier) $${tex(mS * 100, 0)}\\,\\%$. Hvad er fondens afkast på NAV i % (2 decimaler; ignorér gebyrer og rente)?`,
      hint: 'Short-positionen tjener, når de shortede aktier falder: P&L = long·r_L − short·r_S.',
      solution: `P&L $= ${L} \\cdot ${tex(mL, 2)} - ${S} \\cdot ${tex(mS, 2)} = ${tex(L * mL - S * mS, 2)}$ mio., dvs. $${tex(pnl, 2)}\\,\\%$ af NAV.\n\nSvar: **${da(pnl, 2)} %**.`,
      check: { type: 'numeric', answer: Number(pnl.toFixed(2)), tolerance: 0.01, unit: '%' },
    }
  },
})
