import { useMemo, useState } from 'react'
import { parse, normalize, show, churchValue } from '@/lib/lambda'
import { Widget } from './_ui'

export const meta = { title: 'λ-kalkyle: β-reduktion', course: 'foundations' }

const EXAMPLES = ['(λx.x) y', '(λx y.x) a b', 'PLUS 2 3', 'MULT 2 3', 'S K K a', 'AND TRUE FALSE', 'NOT FALSE', 'FST (PAIR a b)', '(λx.λy.x y) y', 'OMEGA']

export default function LambdaReducer({ props }: { props: Record<string, string> }) {
  const [src, setSrc] = useState(props.term || 'PLUS 2 3')
  const [shown, setShown] = useState(1)
  const res = useMemo(() => {
    try {
      const t = parse(src)
      const r = normalize(t, 200)
      return { ...r, error: null as string | null }
    } catch (e) {
      return { steps: [], normal: false, error: (e as Error).message }
    }
  }, [src])
  const last = res.steps[res.steps.length - 1]
  const visible = res.steps.slice(0, Math.max(1, shown))
  const done = shown >= res.steps.length
  const cv = last ? churchValue(last) : null
  return (
    <Widget title="λ-kalkyle: β-reduktion (normal orden)" icon="λ">
      <label className="block text-sm">
        Term (skriv <code>\\</code> eller <code>λ</code>; makroer: I K S TRUE FALSE AND OR NOT SUCC PLUS MULT POW PAIR FST SND OMEGA; tal = Church-tal)
        <input className="input mt-1 font-mono" value={src} onChange={(e) => (setSrc(e.target.value), setShown(1))} spellCheck={false} />
      </label>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((x) => (
          <button key={x} className="btn font-mono text-xs" onClick={() => (setSrc(x), setShown(1))}>
            {x}
          </button>
        ))}
      </div>
      {res.error ? (
        <p className="text-sm" style={{ color: 'var(--bad)' }}>
          {res.error}
        </p>
      ) : (
        <>
          <ol className="max-h-80 space-y-1 overflow-auto rounded-lg p-3 font-mono text-xs" style={{ background: 'var(--surface-2)' }}>
            {visible.map((t, i) => (
              <li key={i} className="break-all">
                <span className="muted">{i === 0 ? '   ' : '→β '}</span>
                {show(t)}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => setShown((s) => s + 1)} disabled={done}>
              Ét β-skridt
            </button>
            <button className="btn btn-primary" onClick={() => setShown(res.steps.length)} disabled={done}>
              Reducér helt
            </button>
          </div>
          {done && (
            <p className="text-sm" role="status">
              {res.normal ? (
                <>
                  Normalform efter <b>{res.steps.length - 1}</b> skridt{cv !== null ? <> — det er Church-tallet <b>{cv}</b></> : ''}.
                </>
              ) : (
                <>Ingen normalform fundet efter {res.steps.length - 1} skridt — termen divergerer måske (som Ω = (λx.x x)(λx.x x)).</>
              )}
            </p>
          )}
        </>
      )}
    </Widget>
  )
}
