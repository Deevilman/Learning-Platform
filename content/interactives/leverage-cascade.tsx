import { useMemo, useState } from 'react'
import { Widget, Slider, Chart, Stat, fmt, pct } from './_ui'

export const meta = { title: 'Gearing og margin-call-kaskade', course: 'hedgefund' }

/**
 * Several funds hold the same asset with leverage. A price shock lowers their
 * equity; funds below the maintenance margin must sell to restore target
 * leverage, and the forced selling pushes the price down further (price
 * impact proportional to quantity sold). Iterate until no fund needs to sell.
 */
function simulate(shock: number, leverage: number, maint: number, impact: number, funds: number) {
  let price = 1
  const units = Array.from({ length: funds }, (_, i) => leverage * (1 + i * 0.25)) // different leverage per fund
  const debt = units.map((u) => u - 1) // each fund starts with equity 1 at price 1
  price *= 1 - shock
  const path: [number, number][] = [[0, 1], [1, price]]
  let sold = 0
  for (let round = 2; round < 40; round++) {
    let sellNow = 0
    for (let i = 0; i < funds; i++) {
      if (units[i] <= 0) continue
      const assets = units[i] * price
      const eq = assets - debt[i]
      if (eq <= 0) {
        sellNow += units[i] // wiped out: everything is liquidated
        debt[i] = 0
        units[i] = 0
        continue
      }
      if (eq / assets < maint) {
        // sell down to the original leverage
        const target = (eq * leverage) / price
        const s = Math.max(0, units[i] - target)
        sellNow += s
        units[i] -= s
        debt[i] -= s * price
      }
    }
    if (sellNow < 1e-9) break
    sold += sellNow
    price *= Math.max(0.01, 1 - impact * sellNow)
    path.push([round, price])
  }
  return { path, price, sold, bust: units.filter((u) => u === 0).length }
}

export default function LeverageCascade() {
  const [shock, setShock] = useState(0.05)
  const [lev, setLev] = useState(4)
  const [maint, setMaint] = useState(0.15)
  const [impact, setImpact] = useState(0.01)
  const [funds, setFunds] = useState(5)
  const res = useMemo(() => simulate(shock, lev, maint, impact, funds), [shock, lev, maint, impact, funds])
  return (
    <Widget title="Brandudsalg: når gearede fonde tvinges til at sælge" icon="🔥">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="Startstød på prisen" value={shock} min={0} max={0.3} step={0.005} onChange={setShock} format={(v) => pct(v, 1)} />
        <Slider label="Gearing (fond 1)" value={lev} min={1} max={10} step={0.5} onChange={setLev} format={(v) => `${v}×`} />
        <Slider label="Vedligeholdelsesmargin" value={maint} min={0.05} max={0.5} step={0.01} onChange={setMaint} format={(v) => pct(v, 0)} />
        <Slider label="Prispåvirkning pr. solgt enhed" value={impact} min={0} max={0.05} step={0.001} onChange={setImpact} format={(v) => pct(v, 1)} />
        <Slider label="Antal fonde i samme handel" value={funds} min={1} max={10} onChange={setFunds} />
      </div>
      <Chart series={[{ points: res.path, color: '#dc2626', width: 2.5 }]} xLabel="runde (0 = før stødet)" yLabel="pris" yDomain={[0, 1.05]} height={200} xFormat={(v) => fmt(v, 0)} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Startstød" value={pct(-shock, 1)} />
        <Stat label="Samlet prisfald" value={pct(res.price - 1, 1)} />
        <Stat label="Tvangssalg (enheder)" value={fmt(res.sold, 2)} />
        <Stat label="Fonde udslettet" value={`${res.bust} af ${funds}`} />
      </div>
      <p className="muted text-sm">Fond i har gearing {lev}× · (1 + 0,25i). Et lille stød kan udløse margin calls; salgene presser prisen, som udløser nye margin calls (LTCM 1998, kvant-krakket august 2007, Archegos 2021). Prøv at sænke gearingen eller øge antallet af fonde i samme handel.</p>
    </Widget>
  )
}
