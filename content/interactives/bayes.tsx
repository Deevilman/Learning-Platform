import { useState } from 'react'
import { Widget, Slider, Stat, pct, fmt } from './_ui'

export const meta = { title: 'Bayes-beregner med frekvensgitter', course: 'quant' }

export default function Bayes({ props }: { props: Record<string, string> }) {
  const [prior, setPrior] = useState(Number(props.prior) || 0.01)
  const [sens, setSens] = useState(Number(props.sens) || 0.95)
  const [spec, setSpec] = useState(Number(props.spec) || 0.95)
  const N = 1000
  const sick = Math.round(prior * N)
  const tp = Math.round(sick * sens)
  const fp = Math.round((N - sick) * (1 - spec))
  const post = (sens * prior) / (sens * prior + (1 - spec) * (1 - prior))
  // Grid of 1000 dots: first the true positives, then false negatives, false positives, true negatives.
  const kinds = Array.from({ length: N }, (_, i) => (i < tp ? 'tp' : i < sick ? 'fn' : i < sick + fp ? 'fp' : 'tn'))
  const color = { tp: 'var(--ok)', fn: '#a3e635', fp: 'var(--bad)', tn: 'var(--border)' } as const
  return (
    <Widget title="Bayes: hvad betyder et positivt testsvar?" icon="🎯">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="Grundrate P(H)" value={prior} min={0.001} max={0.5} step={0.001} onChange={setPrior} format={(v) => pct(v, 1)} />
        <Slider label="Sensitivitet P(+|H)" value={sens} min={0.5} max={1} step={0.005} onChange={setSens} format={(v) => pct(v, 1)} />
        <Slider label="Specificitet P(−|¬H)" value={spec} min={0.5} max={1} step={0.005} onChange={setSpec} format={(v) => pct(v, 1)} />
      </div>
      <svg viewBox="0 0 400 100" className="w-full" role="img" aria-label="1000 personer som prikker">
        {kinds.map((k, i) => (
          <circle key={i} cx={4 + (i % 50) * 8} cy={4 + Math.floor(i / 50) * 4.8} r={1.8} fill={color[k]} />
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 text-xs">
        <span style={{ color: 'var(--ok)' }}>● sande positive: {tp}</span>
        <span style={{ color: '#65a30d' }}>● falske negative: {sick - tp}</span>
        <span style={{ color: 'var(--bad)' }}>● falske positive: {fp}</span>
        <span className="muted">● sande negative: {N - sick - fp}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="P(H | +)" value={pct(post, 2)} />
        <Stat label="af de positive er ægte (ud af 1000)" value={`${tp} / ${tp + fp}`} />
        <Stat label="Likelihood ratio" value={fmt(sens / (1 - spec), 1)} />
      </div>
      <p className="muted text-sm">Når grundraten er lav, dominerer de falske positive — selv med en god test. Samme logik gælder for en backtest, der "består": hvor mange af de strategier, du tester, har overhovedet ægte edge?</p>
    </Widget>
  )
}
