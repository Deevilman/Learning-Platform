import { useMemo, useRef, useState } from 'react'
import { Widget, Chart, Stat, fmt } from './_ui'

export const meta = { title: 'OLS-regression med træk-selv-punkter', course: 'quant', intro: 'Træk i punkterne, og se regressionslinjen og $R^2$ følge med.' }

const START: [number, number][] = [
  [1, 2.1],
  [2, 2.9],
  [3, 4.2],
  [4, 4.8],
  [5, 6.1],
  [6, 6.8],
  [7, 8.2],
]

export default function OlsDrag() {
  const [pts, setPts] = useState<[number, number][]>(START)
  const drag = useRef<number | null>(null)
  const fit = useMemo(() => {
    const n = pts.length
    const mx = pts.reduce((s, p) => s + p[0], 0) / n
    const my = pts.reduce((s, p) => s + p[1], 0) / n
    const sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0)
    const sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0)
    const syy = pts.reduce((s, p) => s + (p[1] - my) ** 2, 0)
    const b = sxx ? sxy / sxx : 0
    const a = my - b * mx
    const r2 = sxx && syy ? (sxy * sxy) / (sxx * syy) : 0
    const resid = pts.map((p) => p[1] - (a + b * p[0]))
    const sse = resid.reduce((s, e) => s + e * e, 0)
    const se = n > 2 && sxx ? Math.sqrt(sse / (n - 2) / sxx) : NaN
    return { a, b, r2, se, t: b / se }
  }, [pts])
  const X: [number, number] = [0, 10]
  const Y: [number, number] = [-2, 12]
  return (
    <Widget title="Mindste kvadraters metode: træk i punkterne" icon="📉">
      <Chart
        xDomain={X}
        yDomain={Y}
        series={[{ points: [[X[0], fit.a + fit.b * X[0]], [X[1], fit.a + fit.b * X[1]]], color: '#dc2626', width: 2.5 }]}
        xLabel="x (fx markedsafkast)"
        yLabel="y (fx aktieafkast)"
        onPointer={(x, y, kind) => {
          if (kind === 'down') {
            let best = -1
            let bd = Infinity
            pts.forEach((p, i) => {
              const d = ((p[0] - x) / 10) ** 2 + ((p[1] - y) / 14) ** 2
              if (d < bd) (bd = d), (best = i)
            })
            if (bd < 0.004) drag.current = best
            else if (pts.length < 25) setPts([...pts, [x, y]])
          } else if (kind === 'move' && drag.current !== null) {
            const i = drag.current
            setPts(pts.map((p, j) => (j === i ? [Math.max(X[0], Math.min(X[1], x)), Math.max(Y[0], Math.min(Y[1], y))] : p)))
          } else if (kind === 'up') drag.current = null
        }}
      >
        {(sx, sy) =>
          pts.map((p, i) => (
            <g key={i}>
              <line x1={sx(p[0])} x2={sx(p[0])} y1={sy(p[1])} y2={sy(fit.a + fit.b * p[0])} stroke="#dc2626" strokeDasharray="2 2" opacity={0.6} />
              <circle cx={sx(p[0])} cy={sy(p[1])} r={7} fill="#2563eb" stroke="var(--surface)" strokeWidth={2} style={{ cursor: 'grab' }} />
            </g>
          ))
        }
      </Chart>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="hældning β̂" value={fmt(fit.b, 3)} />
        <Stat label="skæring α̂" value={fmt(fit.a, 3)} />
        <Stat label="R²" value={fmt(fit.r2, 3)} />
        <Stat label="t-værdi for β̂" value={fmt(fit.t, 2)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={() => setPts(START)}>
          Nulstil
        </button>
        <button className="btn" onClick={() => setPts([...START, [9.5, -1.5]])}>
          Tilføj en outlier
        </button>
        <button className="btn" onClick={() => setPts(pts.slice(0, -1))} disabled={pts.length < 3}>
          Fjern sidste punkt
        </button>
      </div>
      <p className="muted text-sm">Træk i punkterne, eller klik i et tomt område for at tilføje et. De stiplede linjer er residualerne — OLS minimerer summen af deres kvadrater. Læg mærke til, hvor meget ét punkt langt ude til siden (høj leverage) kan flytte linjen.</p>
    </Widget>
  )
}
