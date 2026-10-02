import { useMemo, useState } from 'react'
import { Widget, Slider, Chart, Stat, pct } from './_ui'

export const meta = { title: 'Den effektive rand (3 aktiver)', course: 'quant', intro: 'Ændr afkast, volatilitet og korrelationer for tre aktiver, og se minimum-varians- og tangentporteføljen flytte sig.' }

export default function EfficientFrontier() {
  const [mu, setMu] = useState([0.06, 0.09, 0.12])
  const [sd, setSd] = useState([0.1, 0.16, 0.24])
  const [rho, setRho] = useState([0.2, 0.1, 0.4]) // ρ12, ρ13, ρ23
  const [rf, setRf] = useState(0.02)
  const cov = (i: number, j: number) => (i === j ? sd[i] ** 2 : rho[i + j - 1] * sd[i] * sd[j])
  const { cloud, frontier, tangent, minVar } = useMemo(() => {
    const port = (w: number[]) => {
      const m = w.reduce((s, x, i) => s + x * mu[i], 0)
      let v = 0
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) v += w[i] * w[j] * cov(i, j)
      return { m, s: Math.sqrt(Math.max(v, 0)), w }
    }
    const cloud: { x: number; y: number }[] = []
    let best = { sr: -Infinity, p: port([1, 0, 0]) }
    let mv = port([1, 0, 0])
    const N = 40
    const grid: ReturnType<typeof port>[] = []
    for (let a = 0; a <= N; a++)
      for (let b = 0; a + b <= N; b++) {
        const p = port([a / N, b / N, (N - a - b) / N])
        grid.push(p)
        if ((a + b) % 3 === 0) cloud.push({ x: p.s, y: p.m })
        const sr = (p.m - rf) / p.s
        if (sr > best.sr) best = { sr, p }
        if (p.s < mv.s) mv = p
      }
    // Upper envelope: for each return level, the minimum volatility (long-only).
    const levels = 50
    const lo = mv.m
    const hi = Math.max(...mu)
    const frontier: [number, number][] = []
    for (let k = 0; k <= levels; k++) {
      const target = lo + ((hi - lo) * k) / levels
      const near = grid.filter((p) => Math.abs(p.m - target) < (hi - lo) / levels / 1.5 + 1e-9)
      if (near.length) frontier.push([Math.min(...near.map((p) => p.s)), target])
    }
    return { cloud, frontier: frontier.sort((a, b) => a[1] - b[1]), tangent: best, minVar: mv }
  }, [mu, sd, rho, rf]) // eslint-disable-line react-hooks/exhaustive-deps
  const setAt = (arr: number[], set: (a: number[]) => void, i: number) => (v: number) => set(arr.map((x, j) => (j === i ? v : x)))
  const cmlEnd = tangent.p.s * 1.6
  return (
    <Widget title="Porteføljeteori: den effektive rand og tangentporteføljen" icon="🧺">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1 rounded-lg p-2" style={{ background: 'var(--surface-2)' }}>
            <b className="text-sm">Aktiv {i + 1}</b>
            <Slider label="μ" value={mu[i]} min={0} max={0.2} step={0.005} onChange={setAt(mu, setMu, i)} format={(v) => pct(v, 1)} />
            <Slider label="σ" value={sd[i]} min={0.03} max={0.4} step={0.005} onChange={setAt(sd, setSd, i)} format={(v) => pct(v, 1)} />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Slider label="ρ₁₂" value={rho[0]} min={-0.9} max={0.95} step={0.05} onChange={setAt(rho, setRho, 0)} format={(v) => v.toFixed(2)} />
        <Slider label="ρ₁₃" value={rho[1]} min={-0.9} max={0.95} step={0.05} onChange={setAt(rho, setRho, 1)} format={(v) => v.toFixed(2)} />
        <Slider label="ρ₂₃" value={rho[2]} min={-0.9} max={0.95} step={0.05} onChange={setAt(rho, setRho, 2)} format={(v) => v.toFixed(2)} />
        <Slider label="r_f" value={rf} min={0} max={0.06} step={0.0025} onChange={setRf} format={(v) => pct(v, 2)} />
      </div>
      <Chart
        dots={[
          ...cloud.map((c) => ({ ...c, r: 1.6, color: '#94a3b8' })),
          ...[0, 1, 2].map((i) => ({ x: sd[i], y: mu[i], r: 5, color: '#2563eb', label: `Aktiv ${i + 1}` })),
          { x: minVar.s, y: minVar.m, r: 6, color: '#059669', label: 'Minimum-varians' },
          { x: tangent.p.s, y: tangent.p.m, r: 6, color: '#dc2626', label: 'Tangentportefølje' },
        ]}
        series={[
          { points: frontier, color: '#7c3aed', width: 2.5 },
          { points: [[0, rf], [cmlEnd, rf + tangent.sr * cmlEnd]], color: '#dc2626', width: 1.5, dashed: true },
        ]}
        xDomain={[0, Math.max(...sd) * 1.15]}
        xLabel="volatilitet σ"
        yLabel="forventet afkast μ"
        xFormat={(v) => pct(v, 0)}
        yFormat={(v) => pct(v, 0)}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Tangent: vægte" value={tangent.p.w.map((w) => pct(w, 0)).join(' / ')} />
        <Stat label="Tangent: Sharpe" value={tangent.sr.toFixed(2)} />
        <Stat label="Min.-varians: σ" value={pct(minVar.s, 1)} />
        <Stat label="Min.-varians: vægte" value={minVar.w.map((w) => pct(w, 0)).join(' / ')} />
      </div>
      <p className="muted text-sm">Grå prikker: long-only porteføljer. Lilla: den effektive rand. Rød stiplet linje: kapitalmarkedslinjen gennem r_f og tangentporteføljen (højest Sharpe). Prøv negativ korrelation: randen bøjer mod venstre (diversifikation).</p>
    </Widget>
  )
}
