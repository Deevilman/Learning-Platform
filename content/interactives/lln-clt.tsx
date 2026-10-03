import { useMemo, useState } from 'react'
import { Widget, Slider, Chart, Buttons, rng, fmt, PALETTE, normPdf } from './_ui'

export const meta = { title: 'Monte Carlo: store tals lov og CLT', course: 'quant', intro: 'Træk mange stikprøver, og se gennemsnittet falde til ro og fordelingen blive normal.' }

type Dist = 'coin' | 'die' | 'exp' | 'skew'
const DISTS: { id: Dist; label: string; mean: number; sd: number; draw: (r: ReturnType<typeof rng>) => number }[] = [
  { id: 'coin', label: 'Mønt (0/1)', mean: 0.5, sd: 0.5, draw: (r) => (r.next() < 0.5 ? 1 : 0) },
  { id: 'die', label: 'Terning', mean: 3.5, sd: Math.sqrt(35 / 12), draw: (r) => 1 + Math.floor(r.next() * 6) },
  { id: 'exp', label: 'Eksponential', mean: 1, sd: 1, draw: (r) => -Math.log(1 - r.next()) },
  { id: 'skew', label: 'Lotteri (skæv)', mean: 0.1 * 9 + 0.9 * -1, sd: Math.sqrt(0.1 * 81 + 0.9 * 1 - (0.1 * 9 - 0.9) ** 2), draw: (r) => (r.next() < 0.1 ? 9 : -1) },
]

export default function LlnClt() {
  const [mode, setMode] = useState<'lln' | 'clt'>('clt')
  const [dist, setDist] = useState<Dist>('exp')
  const [n, setN] = useState(10)
  const [seed, setSeed] = useState(1)
  const D = DISTS.find((d) => d.id === dist)!
  const lln = useMemo(() => {
    const r = rng(seed)
    const paths = [0, 1, 2].map(() => {
      let s = 0
      const pts: [number, number][] = []
      for (let i = 1; i <= 2000; i++) {
        s += D.draw(r)
        if (i % 5 === 0 || i < 50) pts.push([i, s / i])
      }
      return pts
    })
    return paths
  }, [seed, D])
  const clt = useMemo(() => {
    const r = rng(seed + 99)
    const means = Array.from({ length: 4000 }, () => {
      let s = 0
      for (let i = 0; i < n; i++) s += D.draw(r)
      return s / n
    })
    const se = D.sd / Math.sqrt(n)
    const lo = D.mean - 4 * se
    const hi = D.mean + 4 * se
    const bins = 40
    const w = (hi - lo) / bins
    const counts = new Array(bins).fill(0)
    for (const m of means) {
      const b = Math.floor((m - lo) / w)
      if (b >= 0 && b < bins) counts[b]++
    }
    const bars = counts.map((c, i) => ({ x0: lo + i * w, x1: lo + (i + 1) * w, y: c / (means.length * w) }))
    const curve: [number, number][] = Array.from({ length: 120 }, (_, i) => {
      const x = lo + ((hi - lo) * i) / 119
      return [x, normPdf((x - D.mean) / se) / se]
    })
    return { bars, curve, lo, hi }
  }, [seed, n, D])
  return (
    <Widget title="Monte Carlo: store tals lov og den centrale grænseværdisætning" icon="🎲">
      <div className="flex flex-wrap gap-3">
        <Buttons options={[{ id: 'lln', label: 'Store tals lov' }, { id: 'clt', label: 'CLT' }]} value={mode} onChange={setMode} />
        <Buttons options={DISTS.map((d) => ({ id: d.id, label: d.label }))} value={dist} onChange={setDist} />
      </div>
      {mode === 'lln' ? (
        <>
          <Chart series={lln.map((p, i) => ({ points: p, color: PALETTE[i], width: 1.5 }))} hLines={[{ y: D.mean, label: `E[X] = ${fmt(D.mean)}` }]} xLabel="antal udfald n" yLabel="gennemsnit" />
          <p className="muted text-sm">Tre uafhængige forløb af det løbende gennemsnit. De nærmer sig alle E[X] — men langsomt: afvigelsen skrumper som 1/√n.</p>
        </>
      ) : (
        <>
          <Slider label="Stikprøvestørrelse n" value={n} min={1} max={100} onChange={setN} />
          <Chart bars={clt.bars} series={[{ points: clt.curve, color: PALETTE[3], width: 2 }]} xDomain={[clt.lo, clt.hi]} xLabel="stikprøvegennemsnit" yLabel="tæthed" yFormat={(v) => fmt(v, 2)} />
          <p className="muted text-sm">Histogram af 4000 gennemsnit af n udfald; den røde kurve er normalfordelingen N(μ, σ²/n). Prøv den skæve fordeling: for små n er histogrammet skævt, men det bliver normalt, når n vokser.</p>
        </>
      )}
      <button className="btn" onClick={() => setSeed((s) => s + 1)}>
        Nye tilfældige tal
      </button>
    </Widget>
  )
}
