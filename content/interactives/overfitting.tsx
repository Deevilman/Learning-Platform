import { useMemo, useState } from 'react'
import { Widget, Slider, Chart, Stat, rng, fmt } from './_ui'

export const meta = { title: 'Overfitting: den bedste af N tilfældige strategier', course: 'quant' }

export default function Overfitting() {
  const [N, setN] = useState(100)
  const [seed, setSeed] = useState(11)
  const days = 252 * 2
  const sim = useMemo(() => {
    const r = rng(seed)
    let best = { sr: -Infinity, ins: [] as [number, number][], oos: [] as [number, number][] }
    const srs: number[] = []
    for (let k = 0; k < N; k++) {
      // Each "strategy" is pure noise: daily returns ~ N(0, 1 %).
      const rets = Array.from({ length: days * 2 }, () => r.normal() * 0.01)
      const ins = rets.slice(0, days)
      const m = ins.reduce((a, b) => a + b, 0) / days
      const s = Math.sqrt(ins.reduce((a, b) => a + (b - m) ** 2, 0) / (days - 1))
      const sr = (m / s) * Math.sqrt(252)
      srs.push(sr)
      if (sr > best.sr) {
        let c = 0
        const pts: [number, number][] = [[0, 0]]
        rets.forEach((x, i) => ((c += x), pts.push([i + 1, c * 100])))
        best = { sr, ins: pts.slice(0, days + 1), oos: pts.slice(days) }
      }
    }
    const oosR = best.oos.slice(1).map((p, i) => p[1] - best.oos[i][1])
    const m = oosR.reduce((a, b) => a + b, 0) / oosR.length
    const s = Math.sqrt(oosR.reduce((a, b) => a + (b - m) ** 2, 0) / (oosR.length - 1))
    return { best, oosSr: (m / s) * Math.sqrt(252), srs }
  }, [N, seed]) // eslint-disable-line react-hooks/exhaustive-deps
  // Expected max of N standard normals ≈ sqrt(2 ln N); SR estimate has sd ≈ 1/sqrt(years).
  const expectedMax = N > 1 ? Math.sqrt(2 * Math.log(N)) / Math.sqrt(2) : 0
  return (
    <Widget title="Overfitting: vælg den bedste af N strategier uden edge" icon="🎰">
      <Slider label="Antal afprøvede strategier N" value={N} min={1} max={1000} onChange={setN} />
      <Chart
        series={[
          { points: sim.best.ins, color: '#059669', width: 2, label: 'In-sample (2 år, brugt til at vælge)' },
          { points: sim.best.oos, color: '#dc2626', width: 2, label: 'Out-of-sample (de næste 2 år)' },
        ]}
        vLines={[{ x: days, label: 'valg' }]}
        xLabel="handelsdage"
        yLabel="kumuleret afkast (%)"
        legend
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Bedste in-sample Sharpe" value={fmt(sim.best.sr, 2)} />
        <Stat label="Samme strategi out-of-sample" value={fmt(sim.oosSr, 2)} />
        <Stat label="Forventet max ved ren støj ≈ √(2 ln N)/√år" value={fmt(expectedMax, 2)} />
      </div>
      <p className="muted text-sm">Alle strategier er ren støj (ægte Sharpe = 0). Jo flere du afprøver, jo bedre ser vinderen ud i backtesten — og out-of-sample falder den tilbage mod 0. Det er grunden til Deflated Sharpe Ratio og præregistrering (uge 10).</p>
      <button className="btn" onClick={() => setSeed((s) => s + 1)}>
        Ny simulering
      </button>
    </Widget>
  )
}
