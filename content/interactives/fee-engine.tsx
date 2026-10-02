import { useMemo, useState } from 'react'
import { Widget, Slider, Chart, Stat, fmt, pct } from './_ui'

export const meta = { title: 'Gebyrmotor med high-water mark', course: 'hedgefund' }

// The plan's week-2 fee engine (hard hurdle).
function run(gs: number[], m: number, p: number, h: number, hwm: boolean) {
  let V = 100
  let H = 100
  let fees = 0
  const rows = gs.map((g, i) => {
    const M = m * V
    const Vt = V * (1 + g) - M
    const T = (hwm ? H : V) * (1 + h)
    const I = p * Math.max(Vt - T, 0)
    const V1 = Vt - I
    fees += M + I
    const row = { year: i + 1, g, V0: V, M, I, V1, H: hwm ? H : V }
    V = V1
    if (hwm && I > 0) H = V1
    return row
  })
  return { rows, V, fees }
}

export default function FeeEngine() {
  const [m, setM] = useState(0.02)
  const [p, setP] = useState(0.2)
  const [h, setH] = useState(0)
  const [gs, setGs] = useState([0.15, -0.2, 0.18, 0.12, -0.05, 0.25])
  const withH = useMemo(() => run(gs, m, p, h, true), [gs, m, p, h])
  const without = useMemo(() => run(gs, m, p, h, false), [gs, m, p, h])
  const gross = gs.reduce((v, g) => v * (1 + g), 100)
  return (
    <Widget title="Gebyrmotoren: 2 og 20 med og uden high-water mark" icon="💰">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="Forvaltningshonorar m" value={m} min={0} max={0.03} step={0.0025} onChange={setM} format={(v) => pct(v, 2)} />
        <Slider label="Resultathonorar p" value={p} min={0} max={0.4} step={0.01} onChange={setP} format={(v) => pct(v, 0)} />
        <Slider label="Hurdle h (hard)" value={h} min={0} max={0.1} step={0.005} onChange={setH} format={(v) => pct(v, 1)} />
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">Bruttoafkast pr. år (klik og ret)</div>
        <div className="flex flex-wrap gap-2">
          {gs.map((g, i) => (
            <label key={i} className="text-xs">
              År {i + 1}
              <input type="number" step={1} className="input mt-0.5 w-20" value={Math.round(g * 100)} onChange={(e) => setGs(gs.map((x, j) => (j === i ? Number(e.target.value) / 100 : x)))} />
            </label>
          ))}
          <button className="btn self-end" onClick={() => setGs([...gs, 0.08])} disabled={gs.length >= 12}>
            + år
          </button>
          <button className="btn self-end" onClick={() => setGs(gs.slice(0, -1))} disabled={gs.length <= 1}>
            − år
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="md-table text-sm" style={{ display: 'table' }}>
          <thead>
            <tr>
              <th>År</th>
              <th>g</th>
              <th>NAV primo</th>
              <th>HWM</th>
              <th>M</th>
              <th>I (resultat)</th>
              <th>NAV ultimo</th>
              <th className="muted">I uden HWM</th>
            </tr>
          </thead>
          <tbody>
            {withH.rows.map((r, i) => (
              <tr key={r.year}>
                <td>{r.year}</td>
                <td>{pct(r.g, 0)}</td>
                <td>{fmt(r.V0, 2)}</td>
                <td>{fmt(r.H, 2)}</td>
                <td>{fmt(r.M, 2)}</td>
                <td style={{ fontWeight: 700, color: r.I > 0 ? 'var(--warn)' : undefined }}>{fmt(r.I, 2)}</td>
                <td>{fmt(r.V1, 2)}</td>
                <td className="muted">{fmt(without.rows[i].I, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Chart
        series={[
          { points: [[0, 100], ...gs.map((_, i) => [i + 1, gs.slice(0, i + 1).reduce((v, g) => v * (1 + g), 100)] as [number, number])], color: '#64748b', label: 'Brutto' },
          { points: [[0, 100], ...withH.rows.map((r) => [r.year, r.V1] as [number, number])], color: '#059669', label: 'Netto med HWM' },
          { points: [[0, 100], ...without.rows.map((r) => [r.year, r.V1] as [number, number])], color: '#dc2626', label: 'Netto uden HWM', dashed: true },
        ]}
        xLabel="år"
        yLabel="NAV"
        height={200}
        legend
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Brutto slut-NAV" value={fmt(gross, 2)} />
        <Stat label="Netto med HWM" value={fmt(withH.V, 2)} />
        <Stat label="Netto uden HWM" value={fmt(without.V, 2)} />
        <Stat label="Gebyrer i alt (med HWM)" value={fmt(withH.fees, 2)} />
      </div>
    </Widget>
  )
}
