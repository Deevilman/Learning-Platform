import { useMemo, useState } from 'react'
import { Widget } from './_ui'

export const meta = { title: 'Sandhedstabel-bygger', course: 'foundations' }

type F = { k: 'v'; n: string } | { k: 'not'; a: F } | { k: 'and' | 'or' | 'imp' | 'iff' | 'xor' | 'nand'; a: F; b: F } | { k: 'const'; v: boolean }

// Precedence (low → high): ↔, →, ∨, ∧, ¬
function parse(src: string): F {
  const s = src
    .replace(/<->|<=>|↔/g, ' ↔ ')
    .replace(/->|=>|→/g, ' → ')
    .replace(/&&|&|∧|\/\\/g, ' ∧ ')
    .replace(/\|\||\||∨|\\\//g, ' ∨ ')
    .replace(/!|~|¬/g, ' ¬ ')
    .replace(/⊕/g, ' ⊕ ')
    .replace(/↑/g, ' ↑ ')
  const toks = s.match(/[a-zA-Z]\w*|[()¬∧∨→↔⊕↑⊤⊥]/g) || []
  let i = 0
  const peek = () => toks[i]
  const eat = (t?: string) => {
    const x = toks[i++]
    if (t && x !== t) throw new Error(`forventede ${t}`)
    if (x === undefined) throw new Error('udtrykket slutter for tidligt')
    return x
  }
  const iff = (): F => {
    let a = imp()
    while (peek() === '↔') (eat(), (a = { k: 'iff', a, b: imp() }))
    return a
  }
  const imp = (): F => {
    const a = or()
    if (peek() === '→') {
      eat()
      return { k: 'imp', a, b: imp() } // right associative
    }
    return a
  }
  const or = (): F => {
    let a = and()
    while (peek() === '∨' || peek() === '⊕') {
      const op = eat()
      a = { k: op === '∨' ? 'or' : 'xor', a, b: and() }
    }
    return a
  }
  const and = (): F => {
    let a = not()
    while (peek() === '∧' || peek() === '↑') {
      const op = eat()
      a = { k: op === '∧' ? 'and' : 'nand', a, b: not() }
    }
    return a
  }
  const not = (): F => {
    if (peek() === '¬') {
      eat()
      return { k: 'not', a: not() }
    }
    const t = eat()
    if (t === '(') {
      const f = iff()
      eat(')')
      return f
    }
    if (t === '⊤' || t === 'T') return { k: 'const', v: true }
    if (t === '⊥' || t === 'F') return { k: 'const', v: false }
    if (/^[a-z]\w*$/.test(t)) return { k: 'v', n: t }
    throw new Error(`uventet "${t}"`)
  }
  const f = iff()
  if (i < toks.length) throw new Error(`uventet "${toks[i]}"`)
  return f
}

function ev(f: F, s: Record<string, boolean>): boolean {
  switch (f.k) {
    case 'v':
      return s[f.n]
    case 'const':
      return f.v
    case 'not':
      return !ev(f.a, s)
    case 'and':
      return ev(f.a, s) && ev(f.b, s)
    case 'or':
      return ev(f.a, s) || ev(f.b, s)
    case 'xor':
      return ev(f.a, s) !== ev(f.b, s)
    case 'nand':
      return !(ev(f.a, s) && ev(f.b, s))
    case 'imp':
      return !ev(f.a, s) || ev(f.b, s)
    case 'iff':
      return ev(f.a, s) === ev(f.b, s)
  }
}

const SYM = { and: '∧', or: '∨', imp: '→', iff: '↔', xor: '⊕', nand: '↑' } as const
function show(f: F, top = true): string {
  if (f.k === 'v') return f.n
  if (f.k === 'const') return f.v ? '⊤' : '⊥'
  if (f.k === 'not') return '¬' + show(f.a, false)
  const s = `${show(f.a, false)} ${SYM[f.k]} ${show(f.b, false)}`
  return top ? s : `(${s})`
}

function subformulas(f: F, acc: F[] = []): F[] {
  if (f.k === 'not') subformulas(f.a, acc)
  else if (f.k !== 'v' && f.k !== 'const') (subformulas(f.a, acc), subformulas(f.b, acc))
  if (f.k !== 'v' && f.k !== 'const' && !acc.some((g) => show(g) === show(f))) acc.push(f)
  return acc
}

function vars(f: F, acc = new Set<string>()): Set<string> {
  if (f.k === 'v') acc.add(f.n)
  else if (f.k === 'not') vars(f.a, acc)
  else if (f.k !== 'const') (vars(f.a, acc), vars(f.b, acc))
  return acc
}

export default function TruthTable({ props }: { props: Record<string, string> }) {
  const [src, setSrc] = useState(props.formula || '(p -> q) & (q -> r) -> (p -> r)')
  const res = useMemo(() => {
    try {
      const f = parse(src)
      const vs = [...vars(f)].sort()
      if (vs.length > 5) throw new Error('højst 5 variable')
      const cols = subformulas(f)
      const rows = Array.from({ length: 2 ** vs.length }, (_, i) => Object.fromEntries(vs.map((v, j) => [v, !((i >> (vs.length - 1 - j)) & 1)])))
      const vals = rows.map((r) => ev(f, r))
      const n = vals.filter(Boolean).length
      return { f, vs, cols, rows, n, kind: n === rows.length ? 'tautologi' : n === 0 ? 'kontradiktion' : 'opfyldelig (men ikke en tautologi)' }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [src])
  return (
    <Widget title="Sandhedstabel-bygger" icon="⊤">
      <label className="block text-sm">
        Formel (brug <code>~ & | -&gt; &lt;-&gt;</code> eller ¬ ∧ ∨ → ↔)
        <input className="input mt-1 font-mono" value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} />
      </label>
      <div className="flex flex-wrap gap-1.5">
        {['p & ~p', 'p | ~p', '(p -> q) <-> (~q -> ~p)', '~(p & q) <-> (~p & ~q)', '((p -> q) -> p) -> p', 'p ↑ p'].map((x) => (
          <button key={x} className="btn font-mono text-xs" onClick={() => setSrc(x)}>
            {x}
          </button>
        ))}
      </div>
      {'error' in res ? (
        <p className="text-sm" style={{ color: 'var(--bad)' }}>
          Kan ikke læse formlen: {res.error}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="md-table text-center font-mono text-sm" style={{ display: 'table' }}>
              <thead>
                <tr>
                  {res.vs.map((v) => (
                    <th key={v}>{v}</th>
                  ))}
                  {res.cols.map((c, i) => (
                    <th key={i} style={i === res.cols.length - 1 ? { color: 'var(--accent)' } : undefined}>
                      {show(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {res.rows.map((r, i) => (
                  <tr key={i}>
                    {res.vs.map((v) => (
                      <td key={v}>{r[v] ? 'S' : 'F'}</td>
                    ))}
                    {res.cols.map((c, j) => {
                      const val = ev(c, r)
                      return (
                        <td key={j} style={j === res.cols.length - 1 ? { fontWeight: 700, color: val ? 'var(--ok)' : 'var(--bad)' } : undefined}>
                          {val ? 'S' : 'F'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm">
            Sand i <b>{res.n}</b> af {res.rows.length} rækker — formlen er en <b>{res.kind}</b>.
          </p>
        </>
      )}
    </Widget>
  )
}
