import { useMemo, useState } from 'react'
import { Widget, Slider, Chart, Buttons, Stat, fmt, normCdf, normPdf } from './_ui'

export const meta = { title: 'Optioner: payoff og Black–Scholes med Greeks', course: 'quant', intro: 'Vælg en optionsstrategi, flyt aktiekursen, og se payoff, pris og Greeks ændre sig.' }

type Leg = { type: 'call' | 'put' | 'stock'; K: number; qty: number }
const STRATS: Record<string, { label: string; legs: (K: number) => Leg[] }> = {
  call: { label: 'Long call', legs: (K) => [{ type: 'call', K, qty: 1 }] },
  put: { label: 'Long put', legs: (K) => [{ type: 'put', K, qty: 1 }] },
  scall: { label: 'Short call', legs: (K) => [{ type: 'call', K, qty: -1 }] },
  straddle: { label: 'Straddle', legs: (K) => [{ type: 'call', K, qty: 1 }, { type: 'put', K, qty: 1 }] },
  bull: { label: 'Bull call spread', legs: (K) => [{ type: 'call', K: K - 10, qty: 1 }, { type: 'call', K: K + 10, qty: -1 }] },
  covered: { label: 'Covered call', legs: (K) => [{ type: 'stock', K: 0, qty: 1 }, { type: 'call', K, qty: -1 }] },
  protective: { label: 'Protective put', legs: (K) => [{ type: 'stock', K: 0, qty: 1 }, { type: 'put', K, qty: 1 }] },
}

function bs(type: 'call' | 'put', S: number, K: number, r: number, s: number, T: number) {
  if (T <= 1e-9) return { price: Math.max(type === 'call' ? S - K : K - S, 0), delta: type === 'call' ? (S > K ? 1 : 0) : S < K ? -1 : 0, gamma: 0, vega: 0, theta: 0 }
  const d1 = (Math.log(S / K) + (r + (s * s) / 2) * T) / (s * Math.sqrt(T))
  const d2 = d1 - s * Math.sqrt(T)
  const disc = Math.exp(-r * T)
  const price = type === 'call' ? S * normCdf(d1) - K * disc * normCdf(d2) : K * disc * normCdf(-d2) - S * normCdf(-d1)
  const delta = type === 'call' ? normCdf(d1) : normCdf(d1) - 1
  const gamma = normPdf(d1) / (S * s * Math.sqrt(T))
  const vega = (S * normPdf(d1) * Math.sqrt(T)) / 100
  const theta = ((-S * normPdf(d1) * s) / (2 * Math.sqrt(T)) - (type === 'call' ? r * K * disc * normCdf(d2) : -r * K * disc * normCdf(-d2))) / 365
  return { price, delta, gamma, vega, theta }
}

export default function OptionPayoff() {
  const [strat, setStrat] = useState('call')
  const [S, setS] = useState(100)
  const [K, setK] = useState(100)
  const [sigma, setSigma] = useState(0.25)
  const [T, setT] = useState(0.5)
  const [r, setR] = useState(0.03)
  const legs = STRATS[strat].legs(K)
  const value = (s: number, t: number) =>
    legs.reduce((acc, l) => acc + l.qty * (l.type === 'stock' ? s : bs(l.type, s, l.K, r, sigma, t).price), 0)
  const cost = value(S, T)
  const greeks = useMemo(() => {
    const g = { delta: 0, gamma: 0, vega: 0, theta: 0 }
    for (const l of legs) {
      if (l.type === 'stock') {
        g.delta += l.qty
        continue
      }
      const x = bs(l.type, S, l.K, r, sigma, T)
      g.delta += l.qty * x.delta
      g.gamma += l.qty * x.gamma
      g.vega += l.qty * x.vega
      g.theta += l.qty * x.theta
    }
    return g
  }, [legs, S, r, sigma, T])
  const xs = Array.from({ length: 121 }, (_, i) => 40 + i)
  return (
    <Widget title="Optioner: payoff-diagram og Black–Scholes" icon="⚖">
      <Buttons options={Object.entries(STRATS).map(([id, s]) => ({ id, label: s.label }))} value={strat} onChange={setStrat} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="Aktiekurs S" value={S} min={50} max={150} onChange={setS} />
        <Slider label="Strike K" value={K} min={60} max={140} onChange={setK} />
        <Slider label="Volatilitet σ" value={sigma} min={0.05} max={0.8} step={0.01} onChange={setSigma} format={(v) => `${Math.round(v * 100)} %`} />
        <Slider label="Løbetid T (år)" value={T} min={0} max={2} step={0.05} onChange={setT} format={(v) => v.toFixed(2)} />
        <Slider label="Rente r" value={r} min={0} max={0.1} step={0.005} onChange={setR} format={(v) => `${(v * 100).toFixed(1)} %`} />
      </div>
      <Chart
        series={[
          { points: xs.map((x) => [x, value(x, 0) - cost]), color: '#2563eb', width: 2.5, label: 'Gevinst ved udløb (minus pris i dag)' },
          { points: xs.map((x) => [x, value(x, T) - cost]), color: '#dc2626', width: 2, dashed: true, label: 'Værdi i dag (Black–Scholes) minus pris' },
        ]}
        vLines={[{ x: S, label: 'S' }]}
        xLabel="aktiekurs"
        yLabel="gevinst/tab"
        legend
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Pris (BS)" value={fmt(cost, 2)} />
        <Stat label="Delta Δ" value={fmt(greeks.delta, 3)} />
        <Stat label="Gamma Γ" value={fmt(greeks.gamma, 4)} />
        <Stat label="Vega (pr. 1 %-point σ)" value={fmt(greeks.vega, 3)} />
        <Stat label="Theta (pr. dag)" value={fmt(greeks.theta, 3)} />
      </div>
      <p className="muted text-sm">Den røde kurve nærmer sig den blå, når T → 0 (tidsværdien forsvinder). Delta er hældningen af den røde kurve; gamma er dens krumning.</p>
    </Widget>
  )
}
