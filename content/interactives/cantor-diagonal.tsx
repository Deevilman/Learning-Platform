import { useEffect, useMemo, useState } from 'react'
import { Widget, rng } from './_ui'

export const meta = { title: 'Cantors diagonalargument', course: 'foundations' }

export default function Cantor({ props }: { props: Record<string, string> }) {
  const n = Math.min(12, Math.max(4, Number(props.rows) || 8))
  const [seed, setSeed] = useState(7)
  const [k, setK] = useState(0)
  const [playing, setPlaying] = useState(false)
  const rows = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: n }, () => Array.from({ length: n + 3 }, () => (r.next() < 0.5 ? 0 : 1)))
  }, [seed, n])
  useEffect(() => {
    if (!playing) return
    if (k >= n) return setPlaying(false)
    const t = setTimeout(() => setK((x) => x + 1), 600)
    return () => clearTimeout(t)
  }, [playing, k, n])
  const diag = rows.map((r, i) => 1 - r[i])
  return (
    <Widget title="Cantors diagonalargument" icon="⧄">
      <p className="text-sm">
        Antag, at listen nedenfor indeholder <i>alle</i> uendelige 0/1-følger. Vi bygger en ny følge <b>d</b> ved at vende cifferet på diagonalen: <b>d</b> afviger fra række <i>i</i> på plads <i>i</i>.
      </p>
      <div className="overflow-x-auto">
        <table className="font-mono text-sm" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="muted pr-3 text-right">f({i + 1}) =</td>
                {r.map((b, j) => (
                  <td
                    key={j}
                    className="px-1.5 py-0.5 text-center"
                    style={i === j ? { background: i < k ? 'var(--accent-soft)' : 'var(--surface-2)', fontWeight: 700, color: i < k ? 'var(--accent)' : undefined, borderRadius: 4 } : undefined}
                  >
                    {b}
                  </td>
                ))}
                <td className="muted">…</td>
              </tr>
            ))}
            <tr>
              <td className="pr-3 pt-2 text-right font-bold">d =</td>
              {diag.map((b, j) => (
                <td key={j} className="px-1.5 pt-2 text-center font-bold" style={{ color: 'var(--ok)' }}>
                  {j < k ? b : '?'}
                </td>
              ))}
              <td className="muted pt-2">…</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => (k >= n ? (setK(0), setPlaying(true)) : setPlaying((p) => !p))}>
          {playing ? 'Pause' : k >= n ? 'Afspil igen' : 'Afspil'}
        </button>
        <button className="btn" onClick={() => setK((x) => Math.min(n, x + 1))} disabled={k >= n}>
          Ét skridt
        </button>
        <button className="btn" onClick={() => (setSeed((s) => s + 1), setK(0), setPlaying(false))}>
          Ny liste
        </button>
      </div>
      {k > 0 && k <= n && (
        <p className="text-sm" role="status">
          {k < n ? `d afviger fra f(${k}) på plads ${k} (${rows[k - 1][k - 1]} → ${diag[k - 1]}).` : 'd afviger fra hver eneste række i listen — så listen var ikke komplet. Ingen liste kan rumme alle følger: mængden er overtællelig.'}
        </p>
      )}
    </Widget>
  )
}
