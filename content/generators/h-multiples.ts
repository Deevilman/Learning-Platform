import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'h-multiples',
  title: 'Værdiansættelse med multipler',
  course: 'hedgefund',
  topics: ['valuation', 'long-short'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const ebitda = rng.int(80, 400)
    const mult = rng.int(6, 14)
    const net = rng.int(-100, 500)
    const shares = rng.pick([10, 25, 40, 50])
    const ev = ebitda * mult
    const equity = ev - net
    const px = equity / shares
    if (d === 1)
      return {
        prompt: `Sammenlignelige selskaber handles til EV/EBITDA $= ${mult}$. Målselskabet har EBITDA $${ebitda}$ mio. kr. Hvad er den implicitte virksomhedsværdi (mio. kr.)?`,
        hint: 'EV = multipel × EBITDA.',
        solution: `EV $= ${mult} \\cdot ${ebitda} = ${ev}$ mio. kr.\n\nSvar: **${ev}**.`,
        check: { type: 'numeric', answer: ev, tolerance: 0.01 },
      }
    if (d === 2)
      return {
        prompt: `EV/EBITDA $= ${mult}$, EBITDA $= ${ebitda}$ mio. kr., nettogæld $= ${net}$ mio. kr. (negativ = nettokasse), $${shares}$ mio. aktier. Hvad er den implicitte kurs pr. aktie (kr., 2 decimaler)?`,
        hint: 'Egenkapitalværdi = EV − nettogæld. Divider med antal aktier.',
        solution: `EV $= ${ev}$; egenkapital $= ${ev} - (${net}) = ${equity}$; pr. aktie $${equity}/${shares} = ${tex(px, 2)}$ kr.\n\nSvar: **${da(px, 2)}**.`,
        check: { type: 'numeric', answer: Number(px.toFixed(2)), tolerance: 0.01 },
      }
    const price = Number((px * rng.real(0.7, 1.3, 2)).toFixed(2))
    const upside = (px / price - 1) * 100
    return {
      prompt: `Peers handles til EV/EBITDA $= ${mult}$. Målselskabet: EBITDA $${ebitda}$, nettogæld $${net}$ (mio. kr.), $${shares}$ mio. aktier, aktuel kurs $${tex(price, 2)}$ kr. Hvor stort er op-/nedsidepotentialet til den implicitte kurs (i %, 2 decimaler; negativt = nedside)?`,
      hint: 'Find den implicitte kurs, og sammenlign: $(P_{\\text{impl}}/P - 1)$.',
      solution: `Implicit kurs $= (${mult} \\cdot ${ebitda} - (${net}))/${shares} = ${tex(px, 2)}$ kr. Potentiale: $${tex(px, 2)}/${tex(price, 2)} - 1 = ${tex(upside, 2)}\\,\\%$. ${upside > 15 ? 'Kandidat til en long — hvis peers faktisk er sammenlignelige.' : upside < -15 ? 'Kandidat til en short — men tjek, om præmien er fortjent.' : 'Ingen klar fejlprisning.'}\n\nSvar: **${da(upside, 2)} %**.`,
      check: { type: 'numeric', answer: Number(upside.toFixed(2)), tolerance: 0.02, unit: '%' },
    }
  },
})
