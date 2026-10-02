import { useState } from 'react'
import { Widget, Slider, Stat, fmt, pct } from './_ui'

export const meta = { title: 'DCF med følsomhedstabel', course: 'hedgefund', intro: 'Ændr vækst og diskonteringsrente, og se, hvor følsom værdien er — især over for terminalværdien.' }

function dcf(fcf0: number, growth: number, years: number, wacc: number, g: number) {
  let pv = 0
  let f = fcf0
  for (let t = 1; t <= years; t++) {
    f *= 1 + growth
    pv += f / (1 + wacc) ** t
  }
  const tv = wacc > g ? (f * (1 + g)) / (wacc - g) : NaN
  const pvTv = tv / (1 + wacc) ** years
  return { ev: pv + pvTv, pvTv, pv }
}

export default function DcfSensitivity() {
  const [fcf0, setFcf0] = useState(100)
  const [growth, setGrowth] = useState(0.06)
  const [years, setYears] = useState(5)
  const [wacc, setWacc] = useState(0.09)
  const [g, setG] = useState(0.02)
  const [net, setNet] = useState(300)
  const [shares, setShares] = useState(50)
  const base = dcf(fcf0, growth, years, wacc, g)
  const perShare = (ev: number) => (ev - net) / shares
  const waccs = [-0.02, -0.01, 0, 0.01, 0.02].map((d) => wacc + d)
  const gs = [-0.01, -0.005, 0, 0.005, 0.01].map((d) => g + d)
  return (
    <Widget title="DCF: værdi pr. aktie og følsomhed" icon="🧮">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="FCF i dag (mio.)" value={fcf0} min={10} max={500} step={5} onChange={setFcf0} />
        <Slider label="Vækst i prognoseperioden" value={growth} min={-0.05} max={0.25} step={0.005} onChange={setGrowth} format={(v) => pct(v, 1)} />
        <Slider label="Prognoseår" value={years} min={1} max={10} onChange={setYears} />
        <Slider label="WACC" value={wacc} min={0.04} max={0.15} step={0.0025} onChange={setWacc} format={(v) => pct(v, 2)} />
        <Slider label="Terminal vækst g" value={g} min={0} max={0.04} step={0.0025} onChange={setG} format={(v) => pct(v, 2)} />
        <Slider label="Nettogæld (mio.)" value={net} min={-500} max={2000} step={10} onChange={setNet} />
        <Slider label="Aktier (mio.)" value={shares} min={5} max={200} onChange={setShares} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Virksomhedsværdi (EV)" value={fmt(base.ev, 0)} />
        <Stat label="Andel fra terminalværdi" value={pct(base.pvTv / base.ev, 0)} />
        <Stat label="Egenkapital" value={fmt(base.ev - net, 0)} />
        <Stat label="Værdi pr. aktie" value={fmt(perShare(base.ev), 2)} />
      </div>
      <div className="overflow-x-auto">
        <table className="md-table text-center text-sm" style={{ display: 'table' }}>
          <thead>
            <tr>
              <th>WACC ↓ / g →</th>
              {gs.map((x) => (
                <th key={x}>{pct(x, 1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {waccs.map((w) => (
              <tr key={w}>
                <th>{pct(w, 1)}</th>
                {gs.map((x) => {
                  const v = perShare(dcf(fcf0, growth, years, w, x).ev)
                  const rel = v / perShare(base.ev) - 1
                  return (
                    <td key={x} style={{ background: Math.abs(w - wacc) < 1e-9 && Math.abs(x - g) < 1e-9 ? 'var(--accent-soft)' : undefined, color: rel > 0.001 ? 'var(--ok)' : rel < -0.001 ? 'var(--bad)' : undefined }}>
                      {Number.isFinite(v) ? fmt(v, 1) : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted text-sm">Værdi pr. aktie for forskellige WACC og terminal vækst. Bemærk hvor følsom værdien er for g og WACC — og hvor stor en del, der kommer fra terminalværdien.</p>
    </Widget>
  )
}
