import { useMemo, useState } from 'react'
import { Widget } from './_ui'

export const meta = { title: 'MIU-systemet', course: 'foundations' }

interface Move {
  rule: number
  result: string
  where: string
}

function moves(s: string): Move[] {
  const out: Move[] = []
  if (s.endsWith('I')) out.push({ rule: 1, result: s + 'U', where: 'tilføj U' })
  if (s.startsWith('M')) out.push({ rule: 2, result: 'M' + s.slice(1) + s.slice(1), where: `Mx → Mxx` })
  for (let i = 0; i + 3 <= s.length; i++) if (s.slice(i, i + 3) === 'III') out.push({ rule: 3, result: s.slice(0, i) + 'U' + s.slice(i + 3), where: `III på plads ${i + 1}` })
  for (let i = 0; i + 2 <= s.length; i++) if (s.slice(i, i + 2) === 'UU') out.push({ rule: 4, result: s.slice(0, i) + s.slice(i + 2), where: `UU på plads ${i + 1}` })
  return out
}

const RULES = ['xI → xIU', 'Mx → Mxx', 'xIIIy → xUy', 'xUUy → xy']

export default function MIU() {
  const [path, setPath] = useState<{ s: string; rule?: number }[]>([{ s: 'MI' }])
  const cur = path[path.length - 1].s
  const ms = moves(cur)
  const iCount = [...cur].filter((c) => c === 'I').length
  const reachable = useMemo(() => {
    const seen = new Set(['MI'])
    let frontier = ['MI']
    for (let d = 0; d < 6; d++) {
      const next: string[] = []
      for (const s of frontier) for (const m of moves(s)) if (m.result.length <= 14 && !seen.has(m.result)) (seen.add(m.result), next.push(m.result))
      frontier = next
    }
    return seen
  }, [])
  return (
    <Widget title="MIU-systemet (Hofstadter)" icon="Ⓜ">
      <p className="text-sm">
        Aksiom: <b className="font-mono">MI</b>. Regler: {RULES.map((r, i) => (
          <span key={i} className="mr-2 whitespace-nowrap font-mono">
            ({i + 1}) {r}
          </span>
        ))}
        Kan du nå <b className="font-mono">MU</b>?
      </p>
      <div className="rounded-lg p-3 font-mono text-sm" style={{ background: 'var(--surface-2)' }}>
        {path.map((p, i) => (
          <div key={i}>
            {i > 0 && <span className="muted">⊢ (regel {p.rule}) </span>}
            <span style={i === path.length - 1 ? { fontWeight: 700, color: 'var(--accent)' } : undefined}>{p.s}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ms.length === 0 && <span className="muted text-sm">Ingen regler kan bruges.</span>}
        {ms.map((m, i) => (
          <button key={i} className="btn font-mono text-xs" onClick={() => setPath([...path, { s: m.result, rule: m.rule }])} disabled={m.result.length > 40}>
            R{m.rule} ({m.where}) → {m.result.length > 24 ? m.result.slice(0, 22) + '…' : m.result}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={() => setPath(path.slice(0, -1))} disabled={path.length < 2}>
          Fortryd
        </button>
        <button className="btn" onClick={() => setPath([{ s: 'MI' }])}>
          Start forfra
        </button>
      </div>
      <p className="text-sm">
        Antal I i <span className="font-mono">{cur}</span>: <b>{iCount}</b> ≡ <b>{iCount % 3}</b> (mod 3). {reachable.size} strenge (længde ≤ 14) kan nås i højst 6 skridt.
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">Hvorfor er MU umulig? (invarianten)</summary>
        <p className="mt-2">
          Antallet af I'er starter som 1. Regel 2 fordobler det, regel 3 trækker 3 fra, og regel 1 og 4 ændrer det ikke. Ingen regel kan gøre et tal, der ikke er delelig med 3, deleligt med 3 (fordobling af 1 eller 2 mod 3 giver 2 eller 1). MU har 0 I'er, som er deleligt med 3 — så MU er ikke et teorem. Bemærk: det er et argument <i>om</i> systemet (metasprog), ikke en afledning <i>i</i> systemet.
        </p>
      </details>
    </Widget>
  )
}
