import { useMemo, useState } from 'react'
import { Widget, Slider, Chart, Stat, rng, pct, fmt } from './_ui'

export const meta = { title: 'Geometrisk brownsk bevægelse', course: 'quant' }

export default function GBM({ props }: { props: Record<string, string> }) {
  const [mu, setMu] = useState(Number(props.mu) || 0.08)
  const [sigma, setSigma] = useState(Number(props.sigma) || 0.2)
  const [paths, setPaths] = useState(20)
  const [seed, setSeed] = useState(3)
  const T = 5
  const steps = 250
  const data = useMemo(() => {
    const r = rng(seed)
    const dt = T / steps
    const out: [number, number][][] = []
    const finals: number[] = []
    for (let p = 0; p < paths; p++) {
      let S = 100
      const pts: [number, number][] = [[0, S]]
      for (let i = 1; i <= steps; i++) {
        S *= Math.exp((mu - (sigma * sigma) / 2) * dt + sigma * Math.sqrt(dt) * r.normal())
        if (i % 2 === 0) pts.push([i * dt, S])
      }
      out.push(pts)
      finals.push(S)
    }
    finals.sort((a, b) => a - b)
    return { out, median: finals[Math.floor(finals.length / 2)], below: finals.filter((f) => f < 100).length / finals.length }
  }, [mu, sigma, paths, seed])
  const mean: [number, number][] = Array.from({ length: 51 }, (_, i) => [(i * T) / 50, 100 * Math.exp((mu * i * T) / 50)])
  const med: [number, number][] = Array.from({ length: 51 }, (_, i) => [(i * T) / 50, 100 * Math.exp(((mu - (sigma * sigma) / 2) * i * T) / 50)])
  return (
    <Widget title="Geometrisk brownsk bevægelse: dS = μS dt + σS dW" icon="📈">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="Drift μ" value={mu} min={-0.1} max={0.25} step={0.01} onChange={setMu} format={(v) => pct(v, 0)} />
        <Slider label="Volatilitet σ" value={sigma} min={0.05} max={0.8} step={0.01} onChange={setSigma} format={(v) => pct(v, 0)} />
        <Slider label="Antal stier" value={paths} min={1} max={60} onChange={setPaths} />
      </div>
      <Chart
        series={[
          ...data.out.map((p) => ({ points: p, color: '#94a3b8', width: 1, opacity: 0.6 })),
          { points: mean, color: '#2563eb', width: 2.5, label: 'E[Sₜ] = S₀·exp(μt)' },
          { points: med, color: '#dc2626', width: 2.5, dashed: true, label: 'median = S₀·exp((μ − σ²/2)t)' },
        ]}
        xLabel="år"
        yLabel="pris"
        legend
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Forventet slutpris" value={fmt(100 * Math.exp(mu * T), 1)} />
        <Stat label="Median-slutpris (teori)" value={fmt(100 * Math.exp((mu - (sigma * sigma) / 2) * T), 1)} />
        <Stat label="Median i simuleringen" value={fmt(data.median, 1)} />
        <Stat label="Andel stier under 100" value={pct(data.below, 0)} />
      </div>
      <p className="muted text-sm">Volatilitet trækker medianen ned med σ²/2 om året (volatility drag), selv om middelværdien er uændret. Med høj σ ender de fleste stier under middelværdien.</p>
      <button className="btn" onClick={() => setSeed((s) => s + 1)}>
        Nye stier
      </button>
    </Widget>
  )
}
