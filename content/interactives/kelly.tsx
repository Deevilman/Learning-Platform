import { useMemo, useState } from 'react'
import { Widget, Slider, Chart, Stat, rng, fmt, pct } from './_ui'

export const meta = { title: 'Kelly-kriteriet og vækstrate', course: 'quant', intro: 'Vælg sandsynlighed og odds, og find den indsats, der giver den højeste vækst.' }

export default function Kelly({ props }: { props: Record<string, string> }) {
  const [p, setP] = useState(Number(props.p) || 0.55)
  const [b, setB] = useState(Number(props.b) || 1)
  const [seed, setSeed] = useState(2)
  const fStar = Math.max(0, p - (1 - p) / b)
  const g = (f: number) => p * Math.log(1 + f * b) + (1 - p) * Math.log(Math.max(1e-12, 1 - f))
  const curve: [number, number][] = Array.from({ length: 99 }, (_, i) => [i / 100, g(i / 100)])
  const sims = useMemo(() => {
    const r = rng(seed)
    const fs = [fStar / 2, fStar, Math.min(0.99, 2 * fStar)]
    const outcomes = Array.from({ length: 400 }, () => r.next() < p)
    return fs.map((f) => {
      let w = 0
      const pts: [number, number][] = [[0, 0]]
      outcomes.forEach((win, i) => {
        w += Math.log(win ? 1 + f * b : 1 - f)
        pts.push([i + 1, w / Math.LN10])
      })
      return { f, pts }
    })
  }, [p, b, seed, fStar])
  return (
    <Widget title="Kelly: hvor meget skal man satse?" icon="📐">
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="Vinder-sandsynlighed p" value={p} min={0.3} max={0.8} step={0.01} onChange={setP} format={(v) => pct(v, 0)} />
        <Slider label="Gevinst pr. krone b" value={b} min={0.2} max={3} step={0.1} onChange={setB} format={(v) => fmt(v, 1)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Chart series={[{ points: curve, color: '#7c3aed' }]} vLines={[{ x: fStar, label: 'f*' }, { x: 2 * fStar, label: '2f*' }]} yDomain={[-0.1, Math.max(0.02, g(fStar) * 1.4)]} xLabel="andel satset f" yLabel="vækst g(f) pr. spil" height={220} yFormat={(v) => fmt(v, 3)} />
        <Chart
          series={sims.map((s, i) => ({ points: s.pts, color: ['#059669', '#2563eb', '#dc2626'][i], width: 1.5, label: `${['½f*', 'f*', '2f*'][i]} = ${pct(s.f, 0)}` }))}
          xLabel="antal spil"
          yLabel="log₁₀(formue)"
          height={220}
          legend
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Kelly f* = p − (1−p)/b" value={pct(fStar, 1)} />
        <Stat label="Edge pr. spil" value={pct(p * b - (1 - p), 1)} />
        <Stat label="g(f*)" value={fmt(g(fStar), 4)} />
        <Stat label="g(2f*)" value={fmt(g(Math.min(0.99, 2 * fStar)), 4)} />
      </div>
      <p className="muted text-sm">Vækstraten er en parabel-lignende kurve: at satse dobbelt Kelly giver omtrent nul vækst (og enorme udsving). Derfor bruger professionelle ofte en brøkdel af Kelly.</p>
      <button className="btn" onClick={() => setSeed((s) => s + 1)}>
        Ny simulering
      </button>
    </Widget>
  )
}
