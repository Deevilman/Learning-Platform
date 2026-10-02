import { useState } from 'react'
import { Widget, Buttons } from './_ui'

export const meta = { title: 'Mængdeoperationer (Venn)', course: 'foundations', intro: 'Vælg en mængdeoperation, og se den farvet i Venn-diagrammet.' }

// Regions of three sets: bit 0 = A, bit 1 = B, bit 2 = C. Region 0 = outside all.
type Expr = { id: string; label: string; f: (a: boolean, b: boolean, c: boolean) => boolean; three?: boolean }
const EXPRS: Expr[] = [
  { id: 'union', label: 'A ∪ B', f: (a, b) => a || b },
  { id: 'inter', label: 'A ∩ B', f: (a, b) => a && b },
  { id: 'diff', label: 'A \\ B', f: (a, b) => a && !b },
  { id: 'sym', label: 'A △ B', f: (a, b) => a !== b },
  { id: 'compl', label: '(A ∪ B)ᶜ', f: (a, b) => !(a || b) },
  { id: 'dm', label: 'Aᶜ ∩ Bᶜ', f: (a, b) => !a && !b },
  { id: 'dist1', label: 'A ∩ (B ∪ C)', f: (a, b, c) => a && (b || c), three: true },
  { id: 'dist2', label: '(A ∩ B) ∪ (A ∩ C)', f: (a, b, c) => (a && b) || (a && c), three: true },
  { id: 'three', label: '(A \\ B) ∪ C', f: (a, b, c) => (a && !b) || c, three: true },
  { id: 'all3', label: 'A ∩ B ∩ C', f: (a, b, c) => a && b && c, three: true },
]

const W = 320
const H = 230
const CIRC = [
  { cx: 125, cy: 95, r: 70, name: 'A' },
  { cx: 195, cy: 95, r: 70, name: 'B' },
  { cx: 160, cy: 155, r: 70, name: 'C' },
]

export default function Venn({ props }: { props: Record<string, string> }) {
  const [id, setId] = useState(props.expr || 'union')
  const e = EXPRS.find((x) => x.id === id) || EXPRS[0]
  const three = !!e.three
  const circles = three ? CIRC : CIRC.slice(0, 2).map((c) => ({ ...c, cy: 115 }))
  // Rasterise: test membership of each small cell (simple and exact enough to look right).
  const cells: JSX.Element[] = []
  const step = 4
  for (let x = 0; x < W; x += step)
    for (let y = 0; y < H; y += step) {
      const inside = circles.map((c) => (x + step / 2 - c.cx) ** 2 + (y + step / 2 - c.cy) ** 2 <= c.r ** 2)
      if (e.f(inside[0], inside[1], !!inside[2])) cells.push(<rect key={`${x},${y}`} x={x} y={y} width={step} height={step} fill="var(--accent)" opacity={0.45} />)
    }
  return (
    <Widget title="Mængdeoperationer (Venn-diagram)" icon="◎">
      <Buttons options={EXPRS.map((x) => ({ id: x.id, label: x.label }))} value={id} onChange={setId} />
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-md" role="img" aria-label={`Venn-diagram for ${e.label}`}>
        <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke="var(--muted)" rx={8} />
        <text x={10} y={20} fontSize={13}>
          U
        </text>
        {cells}
        {circles.map((c) => (
          <g key={c.name}>
            <circle cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke="var(--text)" strokeWidth={1.5} />
            <text x={c.cx + (c.name === 'A' ? -45 : c.name === 'B' ? 40 : 0)} y={c.cy + (c.name === 'C' ? 50 : -40)} fontSize={15} fontWeight={700} textAnchor="middle" style={{ fill: 'var(--text)' }}>
              {c.name}
            </text>
          </g>
        ))}
      </svg>
      <p className="muted text-sm">
        Det farvede område er <b>{e.label}</b>.{' '}
        {id === 'dm' || id === 'compl' ? 'Sammenlign (A ∪ B)ᶜ og Aᶜ ∩ Bᶜ: det er De Morgans lov.' : id.startsWith('dist') ? 'Sammenlign de to distributive udtryk: samme område.' : ''}
      </p>
    </Widget>
  )
}
