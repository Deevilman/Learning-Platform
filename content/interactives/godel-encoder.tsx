import { useMemo, useState } from 'react'
import { Widget } from './_ui'

export const meta = { title: 'Gödel-nummerering', course: 'foundations', intro: 'Skriv en formel, og se den blive til ét tal — eller skriv et tal og find formlen.' }

// Symbol codes exactly as in the Foundations plan, week 12 (variables are x, x′, x″, …).
const CODES: [string, number][] = [
  ['0', 1], ['S', 2], ['+', 3], ['·', 4], ['=', 5], ['(', 6], [')', 7], ['¬', 8], ['→', 9], ['∀', 10], ['x', 11], ['′', 12],
]
const CODE = new Map(CODES)
const SYM = new Map(CODES.map(([s, c]) => [c, s]))

function primes(n: number) {
  const ps: number[] = []
  for (let k = 2; ps.length < n; k++) if (ps.every((p) => k % p)) ps.push(k)
  return ps
}

export default function GodelEncoder({ props }: { props: Record<string, string> }) {
  const [src, setSrc] = useState(props.formula || '0=0')
  const [num, setNum] = useState('')
  const enc = useMemo(() => {
    const syms = [...src.replace(/\s/g, '').replace(/->/g, '→').replace(/\*/g, '·').replace(/~/g, '¬').replace(/A/g, '∀').replace(/'/g, '′')]
    const bad = syms.filter((s) => !CODE.has(s))
    if (bad.length) return { error: `ukendte symboler: ${[...new Set(bad)].join(' ')}` }
    if (syms.length > 14) return { error: 'højst 14 symboler (tallene bliver enorme)' }
    const ps = primes(syms.length)
    let g = 1n
    syms.forEach((s, i) => (g *= BigInt(ps[i]) ** BigInt(CODE.get(s)!)))
    return { syms, ps, g }
  }, [src])
  const dec = useMemo(() => {
    if (!num.trim()) return null
    let n: bigint
    try {
      n = BigInt(num.trim())
    } catch {
      return { error: 'skriv et helt tal' }
    }
    if (n < 2n) return { error: 'tallet skal være ≥ 2' }
    const out: string[] = []
    for (const p of primes(30).map(BigInt)) {
      if (n === 1n) break
      let e = 0
      while (n % p === 0n) (n /= p, e++)
      if (!e) return { error: `${p} går ikke op — ikke et gyldigt Gödel-nummer (primtallene skal komme i rækkefølge)` }
      const s = SYM.get(e)
      if (!s) return { error: `eksponenten ${e} er ikke en symbolkode` }
      out.push(s)
    }
    if (n !== 1n) return { error: 'tallet har for store primfaktorer' }
    return { text: out.join('') }
  }, [num])
  return (
    <Widget title="Gödel-nummerering" icon="#">
      <p className="text-sm">
        Hvert symbol får en kode; formlen s₁s₂…sₖ får nummeret <span className="font-mono">2^c₁ · 3^c₂ · 5^c₃ ⋯</span>. Entydig primfaktorisering gør, at nummeret kan afkodes igen.
      </p>
      <div className="flex flex-wrap gap-1 text-xs">
        {CODES.map(([s, c]) => (
          <span key={s} className="chip font-mono">
            {s}:{c}
          </span>
        ))}
      </div>
      <label className="block text-sm">
        Formel (fx <code>0=0</code>, <code>S0=S0</code>, <code>~(0=S0)</code>, <code>Ax(x+0=x)</code>; skriv <code>~ -&gt; A * '</code> for ¬ → ∀ · ′)
        <input className="input mt-1 font-mono" value={src} onChange={(e) => setSrc(e.target.value)} />
      </label>
      {'error' in enc ? (
        <p className="text-sm" style={{ color: 'var(--bad)' }}>
          {enc.error}
        </p>
      ) : (
        <div className="space-y-1 text-sm">
          <div className="font-mono">{enc.syms!.map((s, i) => `${enc.ps![i]}^${CODE.get(s)}`).join(' · ')}</div>
          <div className="break-all font-mono font-bold" style={{ color: 'var(--accent)' }}>
            = {enc.g!.toString()}
          </div>
          <div className="muted">{enc.g!.toString().length} cifre</div>
          <button className="btn" onClick={() => setNum(enc.g!.toString())}>
            Afkod dette tal ↓
          </button>
        </div>
      )}
      <label className="block text-sm">
        Afkod et tal
        <input className="input mt-1 font-mono" value={num} onChange={(e) => setNum(e.target.value)} placeholder="fx 2430" />
      </label>
      {dec && ('error' in dec ? <p className="text-sm" style={{ color: 'var(--bad)' }}>{dec.error}</p> : <p className="text-sm">Formel: <b className="font-mono">{dec.text}</b></p>)}
    </Widget>
  )
}
