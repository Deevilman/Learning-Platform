import { useMemo, useState } from 'react'
import { Widget, Slider, Chart, Buttons, Stat, rng, fmt } from './_ui'

export const meta = { title: 'AR(1)- og GARCH(1,1)-simulator', course: 'quant' }

export default function ArGarch() {
  const [model, setModel] = useState<'ar' | 'garch'>('ar')
  const [phi, setPhi] = useState(0.8)
  const [alpha, setAlpha] = useState(0.1)
  const [beta, setBeta] = useState(0.85)
  const [seed, setSeed] = useState(5)
  const N = 500
  const sim = useMemo(() => {
    const r = rng(seed)
    if (model === 'ar') {
      let x = 0
      const xs: number[] = []
      for (let i = 0; i < N + 50; i++) {
        x = phi * x + r.normal()
        if (i >= 50) xs.push(x)
      }
      const m = xs.reduce((a, b) => a + b, 0) / N
      const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / N
      const acf = [1, 2, 3, 4, 5].map((k) => xs.slice(k).reduce((s, x, i) => s + (x - m) * (xs[i] - m), 0) / N / v)
      return { xs, vol: [] as number[], v, acf }
    }
    const omega = 0.05 * (1 - alpha - beta)
    let s2 = omega / Math.max(1e-6, 1 - alpha - beta)
    let e = 0
    const xs: number[] = []
    const vol: number[] = []
    for (let i = 0; i < N + 50; i++) {
      s2 = omega + alpha * e * e + beta * s2
      e = Math.sqrt(s2) * r.normal()
      if (i >= 50) (xs.push(e), vol.push(Math.sqrt(s2)))
    }
    const v = xs.reduce((a, b) => a + b * b, 0) / N
    const sq = xs.map((x) => x * x)
    const ms = sq.reduce((a, b) => a + b, 0) / N
    const vs = sq.reduce((a, b) => a + (b - ms) ** 2, 0) / N
    const acf = [1, 2, 3, 4, 5].map((k) => sq.slice(k).reduce((s, x, i) => s + (x - ms) * (sq[i] - ms), 0) / N / vs)
    return { xs, vol, v, acf }
  }, [model, phi, alpha, beta, seed])
  const pers = alpha + beta
  return (
    <Widget title="Tidsrækker: AR(1) og GARCH(1,1)" icon="〰">
      <Buttons options={[{ id: 'ar', label: 'AR(1): Xₜ = φXₜ₋₁ + εₜ' }, { id: 'garch', label: 'GARCH(1,1): σₜ² = ω + αεₜ₋₁² + βσₜ₋₁²' }]} value={model} onChange={setModel} />
      {model === 'ar' ? (
        <Slider label="φ" value={phi} min={-0.95} max={0.99} step={0.01} onChange={setPhi} format={(v) => v.toFixed(2)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Slider label="α (reaktion på stød)" value={alpha} min={0} max={0.3} step={0.01} onChange={(v) => setAlpha(Math.min(v, 0.995 - beta))} format={(v) => v.toFixed(2)} />
          <Slider label="β (hukommelse)" value={beta} min={0} max={0.98} step={0.01} onChange={(v) => setBeta(Math.min(v, 0.995 - alpha))} format={(v) => v.toFixed(2)} />
        </div>
      )}
      <Chart
        series={[{ points: sim.xs.map((x, i) => [i, x]), color: '#2563eb', width: 1 }, ...(model === 'garch' ? [{ points: sim.vol.map((v, i) => [i, 2 * v] as [number, number]), color: '#dc2626', width: 1.5 }, { points: sim.vol.map((v, i) => [i, -2 * v] as [number, number]), color: '#dc2626', width: 1.5 }] : [])]}
        xLabel="tid"
        yLabel={model === 'ar' ? 'Xₜ' : 'afkast εₜ (rød: ±2σₜ)'}
        height={220}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {model === 'ar' ? (
          <>
            <Stat label="teoretisk varians 1/(1−φ²)" value={fmt(1 / (1 - phi * phi), 2)} />
            <Stat label="simuleret varians" value={fmt(sim.v, 2)} />
            <Stat label="ρ(1): teori / simuleret" value={`${fmt(phi, 2)} / ${fmt(sim.acf[0], 2)}`} />
            <Stat label="halveringstid (perioder)" value={Math.abs(phi) > 0 && Math.abs(phi) < 1 ? fmt(Math.log(0.5) / Math.log(Math.abs(phi)), 1) : '—'} />
          </>
        ) : (
          <>
            <Stat label="persistens α + β" value={fmt(pers, 3)} />
            <Stat label="ACF af εₜ² ved lag 1" value={fmt(sim.acf[0], 2)} />
            <Stat label="ACF af εₜ² ved lag 5" value={fmt(sim.acf[4], 2)} />
            <Stat label="halveringstid for vol-stød" value={pers < 1 && pers > 0 ? fmt(Math.log(0.5) / Math.log(pers), 1) : '—'} />
          </>
        )}
      </div>
      <p className="muted text-sm">
        {model === 'ar'
          ? 'φ tæt på 1 giver lange udsving væk fra middelværdien (langsom mean reversion); negativ φ giver zigzag.'
          : 'Volatiliteten klumper sig: rolige perioder og urolige perioder. Afkastene er næsten ukorrelerede, men deres kvadrater er positivt korrelerede.'}
      </p>
      <button className="btn" onClick={() => setSeed((s) => s + 1)}>
        Ny simulering
      </button>
    </Widget>
  )
}
