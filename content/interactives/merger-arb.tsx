import { useState } from 'react'
import { Widget, Slider, Chart, Stat, pct } from './_ui'

export const meta = { title: 'Fusionsarbitrage: implicit sandsynlighed', course: 'hedgefund', intro: 'Indtast bud og kurser, og se, hvilken sandsynlighed markedet giver for, at handlen gennemføres.' }

export default function MergerArb() {
  const [offer, setOffer] = useState(50)
  const [price, setPrice] = useState(46)
  const [fall, setFall] = useState(35)
  const [months, setMonths] = useState(6)
  const [rf, setRf] = useState(0.03)
  const pImpl = (price - fall) / (offer - fall)
  const up = offer / price - 1
  const down = fall / price - 1
  const ann = (1 + up) ** (12 / months) - 1
  const ps: [number, number][] = Array.from({ length: 101 }, (_, i) => {
    const p = i / 100
    return [p, (p * up + (1 - p) * down) * 100]
  })
  const breakeven = (rf * (months / 12) - down) / (up - down)
  return (
    <Widget title="Fusionsarbitrage: hvad prisfastsætter markedet?" icon="🤝">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="Bud (kr.)" value={offer} min={20} max={100} step={0.5} onChange={(v) => setOffer(Math.max(v, price + 0.5))} />
        <Slider label="Kurs i dag (kr.)" value={price} min={10} max={99} step={0.5} onChange={(v) => setPrice(Math.min(Math.max(v, fall + 0.5), offer - 0.5))} />
        <Slider label="Kurs hvis handlen falder (kr.)" value={fall} min={5} max={90} step={0.5} onChange={(v) => setFall(Math.min(v, price - 0.5))} />
        <Slider label="Måneder til gennemførelse" value={months} min={1} max={24} onChange={setMonths} />
        <Slider label="Risikofri rente" value={rf} min={0} max={0.08} step={0.0025} onChange={setRf} format={(v) => pct(v, 2)} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Spread (op-side)" value={pct(up, 2)} />
        <Stat label="Annualiseret op-side" value={pct(ann, 1)} />
        <Stat label="Ned-side ved brud" value={pct(down, 1)} />
        <Stat label="Implicit sandsynlighed (uden rente)" value={pct(pImpl, 1)} />
      </div>
      <Chart series={[{ points: ps, color: '#7c3aed' }]} vLines={[{ x: pImpl, label: 'implicit p' }, ...(breakeven > 0 && breakeven < 1 ? [{ x: breakeven, label: 'slår r_f', color: '#059669' }] : [])]} xLabel="din sandsynlighed for gennemførelse" yLabel="forventet afkast (%)" height={200} xFormat={(v) => pct(v, 0)} />
      <p className="muted text-sm">
        Op-siden er lille, ned-siden stor: en typisk fusionsarbitrage vinder ofte lidt og taber sjældent meget (negativ skævhed). Din edge er at vurdere sandsynligheden bedre end markedets implicitte {pct(pImpl, 0)}.
      </p>
    </Widget>
  )
}
