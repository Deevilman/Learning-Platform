import { useEffect, useState } from 'react'
import { getRunner, type RunResult } from '@/lib/runners'

/** Runs code once on mount and shows the output. */
export function CodeRunPanel({ lang, code, onResult }: { lang: string; code: string; onResult?: (r: RunResult) => void }) {
  const [status, setStatus] = useState('Starter…')
  const [result, setResult] = useState<RunResult | null>(null)

  useEffect(() => {
    let alive = true
    getRunner(lang).then(async (runner) => {
      if (!runner) {
        setStatus(`Ingen runner for ${lang}. Sammenlign selv med referenceløsningen.`)
        return
      }
      const r = await runner.run(code, { onStatus: (s) => alive && setStatus(s) })
      if (!alive) return
      setResult(r)
      onResult?.(r)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, code])

  if (!result) return <div className="run-output muted">{status}</div>
  return (
    <div className="run-output" role="status" aria-live="polite">
      {result.stdout}
      {result.stderr && <span style={{ color: 'var(--warn)' }}>{result.stderr}</span>}
      {result.error && <span style={{ color: 'var(--bad)' }}>{result.error}</span>}
      {!result.stdout && !result.stderr && !result.error && <span className="muted">(programmet skrev ikke noget)</span>}
      <div className="muted" style={{ fontSize: '0.7rem', marginTop: '0.4rem' }}>
        {result.ms} ms
      </div>
    </div>
  )
}
