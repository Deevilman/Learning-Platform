import { useMemo, useState } from 'react'
import { Widget, Slider, Buttons, Stat, fmt } from './_ui'

export const meta = { title: 'Binomialtræ for optioner', course: 'quant' }

export default function BinomialTree() {
  const [n, setN] = useState(3)
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [u, setU] = useState(1.1)
  const [r, setR] = useState(0.01)
  const [type, setType] = useState<'call' | 'put'>('put')
  const [style, setStyle] = useState<'eu' | 'am'>('am')
  const d = 1 / u
  const q = (1 + r - d) / (u - d)
  const tree = useMemo(() => {
    const pay = (s: number) => Math.max(type === 'call' ? s - K : K - s, 0)
    const levels: { s: number; v: number; ex: boolean }[][] = []
    let vals = Array.from({ length: n + 1 }, (_, j) => {
      const s = S * u ** (n - j) * d ** j
      return { s, v: pay(s), ex: false }
    })
    levels[n] = vals
    for (let t = n - 1; t >= 0; t--) {
      vals = Array.from({ length: t + 1 }, (_, j) => {
        const s = S * u ** (t - j) * d ** j
        const cont = (q * levels[t + 1][j].v + (1 - q) * levels[t + 1][j + 1].v) / (1 + r)
        const ex = style === 'am' && pay(s) > cont + 1e-12
        return { s, v: ex ? pay(s) : cont, ex }
      })
      levels[t] = vals
    }
    return levels
  }, [n, S, K, u, r, type, style, d, q])
  const W = 640
  const H = 80 + n * 70
  const x = (t: number) => 60 + (t * (W - 120)) / n
  const y = (t: number, j: number) => H / 2 + (j - t / 2) * 70
  const ok = d < 1 + r && 1 + r < u
  return (
    <Widget title="Binomialmodellen: baglæns induktion" icon="🌳">
      <div className="flex flex-wrap gap-2">
        <Buttons options={[{ id: 'call', label: 'Call' }, { id: 'put', label: 'Put' }]} value={type} onChange={setType} />
        <Buttons options={[{ id: 'eu', label: 'Europæisk' }, { id: 'am', label: 'Amerikansk' }]} value={style} onChange={setStyle} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="Perioder n" value={n} min={1} max={6} onChange={setN} />
        <Slider label="S₀" value={S} min={50} max={150} onChange={setS} />
        <Slider label="Strike K" value={K} min={50} max={150} onChange={setK} />
        <Slider label="u (d = 1/u)" value={u} min={1.02} max={1.5} step={0.01} onChange={setU} format={(v) => v.toFixed(2)} />
        <Slider label="Rente pr. periode" value={r} min={0} max={0.1} step={0.005} onChange={setR} format={(v) => `${(v * 100).toFixed(1)} %`} />
      </div>
      {!ok && <p style={{ color: 'var(--bad)' }}>Arbitrage: kræver d &lt; 1 + r &lt; u.</p>}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img" aria-label="Binomialtræ">
          {tree.slice(0, n).map((lv, t) =>
            lv.map((_, j) => (
              <g key={`${t}-${j}`}>
                <line x1={x(t)} y1={y(t, j)} x2={x(t + 1)} y2={y(t + 1, j)} stroke="var(--border)" />
                <line x1={x(t)} y1={y(t, j)} x2={x(t + 1)} y2={y(t + 1, j + 1)} stroke="var(--border)" />
              </g>
            )),
          )}
          {tree.map((lv, t) =>
            lv.map((node, j) => (
              <g key={`n${t}-${j}`}>
                <rect x={x(t) - 34} y={y(t, j) - 17} width={68} height={34} rx={6} fill={node.ex ? 'var(--warn-soft)' : 'var(--surface-2)'} stroke={node.ex && t < n ? 'var(--warn)' : 'var(--border)'} />
                <text x={x(t)} y={y(t, j) - 3} fontSize={11} textAnchor="middle" style={{ fill: 'var(--muted)' }}>
                  S={fmt(node.s, 1)}
                </text>
                <text x={x(t)} y={y(t, j) + 11} fontSize={12} fontWeight={700} textAnchor="middle" style={{ fill: 'var(--text)' }}>
                  {fmt(node.v, 2)}
                </text>
              </g>
            )),
          )}
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Risikoneutral q" value={fmt(q, 4)} />
        <Stat label="Optionspris" value={fmt(tree[0][0].v, 4)} />
        <Stat label="Δ i roden" value={fmt((tree[1][0].v - tree[1][1].v) / (tree[1][0].s - tree[1][1].s), 4)} />
      </div>
      <p className="muted text-sm">Hver knude: aktiekurs og optionsværdi. Gule knuder: amerikansk tidlig indfrielse er optimal. Værdien i en knude er den diskonterede risikoneutrale forventning af de to efterfølgere.</p>
    </Widget>
  )
}
