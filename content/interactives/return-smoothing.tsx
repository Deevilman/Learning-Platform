import { useMemo, useState } from 'react'
import { Widget, Slider, Chart, Stat, rng, fmt, pct } from './_ui'

export const meta = { title: 'Afkastudglatning og oppustet Sharpe', course: 'hedgefund', intro: 'Glat afkastene ud, og se Sharpe ratio blive pustet op, uden at risikoen er ændret.' }

export default function ReturnSmoothing() {
  const [theta, setTheta] = useState(0.6)
  const [seed, setSeed] = useState(4)
  const months = 120
  const sim = useMemo(() => {
    const r = rng(seed)
    const mu = 0.006
    const sd = 0.04
    const truth = Array.from({ length: months }, () => mu + sd * r.normal())
    // Reported return = (1 − θ)·true + θ·previous reported (stale pricing of illiquid assets).
    const rep: number[] = []
    truth.forEach((x, i) => rep.push((1 - theta) * x + theta * (i ? rep[i - 1] : mu)))
    const stats = (xs: number[]) => {
      const m = xs.reduce((a, b) => a + b, 0) / xs.length
      const s = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1))
      const ac = xs.slice(1).reduce((a, x, i) => a + (x - m) * (xs[i] - m), 0) / xs.reduce((a, x) => a + (x - m) ** 2, 0)
      let peak = 1
      let v = 1
      let dd = 0
      for (const x of xs) {
        v *= 1 + x
        peak = Math.max(peak, v)
        dd = Math.min(dd, v / peak - 1)
      }
      return { sharpe: (m / s) * Math.sqrt(12), vol: s * Math.sqrt(12), ac, dd }
    }
    const cum = (xs: number[]) => {
      let v = 100
      return [[0, 100] as [number, number], ...xs.map((x, i) => ((v *= 1 + x), [i + 1, v] as [number, number]))]
    }
    return { t: stats(truth), s: stats(rep), ct: cum(truth), cs: cum(rep) }
  }, [theta, seed])
  // Lo (2002)-style correction for AR(1) smoothing: σ_true ≈ σ_rep · sqrt((1+ρ)/(1−ρ)).
  const corr = sim.s.ac < 0.99 ? sim.s.sharpe / Math.sqrt((1 + sim.s.ac) / (1 - sim.s.ac)) : NaN
  return (
    <Widget title="Udglattede afkast: hvorfor illikvide fonde ser for gode ud" icon="🫧">
      <Slider label="Udglatning θ (andel af sidste måneds rapporterede afkast)" value={theta} min={0} max={0.9} step={0.05} onChange={setTheta} format={(v) => fmt(v, 2)} />
      <Chart
        series={[
          { points: sim.ct, color: '#64748b', width: 1.5, label: 'Sande afkast' },
          { points: sim.cs, color: '#7c3aed', width: 2.5, label: 'Rapporterede (udglattede) afkast' },
        ]}
        xLabel="måned"
        yLabel="værdi"
        height={200}
        legend
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Sharpe: sand / rapporteret" value={`${fmt(sim.t.sharpe, 2)} / ${fmt(sim.s.sharpe, 2)}`} />
        <Stat label="Volatilitet: sand / rapporteret" value={`${pct(sim.t.vol, 1)} / ${pct(sim.s.vol, 1)}`} />
        <Stat label="Autokorrelation (rapporteret)" value={fmt(sim.s.ac, 2)} />
        <Stat label="Sharpe korrigeret for AR(1)" value={fmt(corr, 2)} />
      </div>
      <p className="muted text-sm">Når illikvide aktiver prissættes med forsinkelse, bliver de rapporterede afkast glattere: lavere volatilitet, højere Sharpe og positiv autokorrelation — uden at den økonomiske risiko er mindre. Høj autokorrelation er et advarselstegn i due diligence (Getmansky, Lo & Makarov 2004).</p>
      <button className="btn" onClick={() => setSeed((s) => s + 1)}>
        Ny simulering
      </button>
    </Widget>
  )
}
