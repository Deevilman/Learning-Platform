// Shared building blocks for interactive components (not a component itself:
// files starting with "_" are not registered).

import { useId, useMemo, type ReactNode } from 'react'
import { formatNumber } from '@/lib/format'

export const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2', '#db2777', '#65a30d']

export function Widget({ title, children, icon = '🧪' }: { title: string; children: ReactNode; icon?: string }) {
  return (
    <figure className="widget not-prose space-y-3">
      <figcaption className="widget-title">
        <span aria-hidden>{icon}</span> {title}
      </figcaption>
      {children}
    </figure>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="flex justify-between gap-2">
        <span>{label}</span>
        <span className="font-mono font-semibold">{format(value)}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

export function NumberInput({ label, value, onChange, step = 1, min, max }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  const id = useId()
  return (
    <label htmlFor={id} className="block text-sm">
      {label}
      <input id={id} type="number" className="input mt-1" value={value} step={step} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat">
      <b>{value}</b>
      {label}
    </div>
  )
}

export const fmt = (x: number, d = 2) =>
  Number.isFinite(x) ? formatNumber(x, { decimals: d, fixed: true }) : '—'
export const pct = (x: number, d = 1) => `${fmt(x * 100, d)} %`

// ---------- seeded randomness for simulations

export function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  let spare: number | null = null
  const normal = () => {
    if (spare !== null) {
      const s = spare
      spare = null
      return s
    }
    let u = 0
    let v = 0
    while (u === 0) u = next()
    while (v === 0) v = next()
    const r = Math.sqrt(-2 * Math.log(u))
    spare = r * Math.sin(2 * Math.PI * v)
    return r * Math.cos(2 * Math.PI * v)
  }
  return { next, normal }
}

export function normCdf(x: number) {
  const t = 1 / (1 + 0.3275911 * (Math.abs(x) / Math.SQRT2))
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2)
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y)
}
export const normPdf = (x: number) => Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI)

// ---------- charts (plain SVG)

export interface Series {
  points: [number, number][]
  color?: string
  label?: string
  width?: number
  dashed?: boolean
  opacity?: number
}

function niceTicks(lo: number, hi: number, n = 5) {
  if (!(hi > lo)) return [lo]
  const raw = (hi - lo) / n
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toPrecision(12)))
  return out
}

export interface ChartProps {
  series?: Series[]
  dots?: { x: number; y: number; color?: string; r?: number; label?: string }[]
  bars?: { x0: number; x1: number; y: number; color?: string }[]
  height?: number
  xLabel?: string
  yLabel?: string
  xDomain?: [number, number]
  yDomain?: [number, number]
  hLines?: { y: number; color?: string; label?: string }[]
  vLines?: { x: number; color?: string; label?: string }[]
  onPointer?: (x: number, y: number, kind: 'down' | 'move' | 'up') => void
  children?: (sx: (x: number) => number, sy: (y: number) => number) => ReactNode
  legend?: boolean
  yFormat?: (v: number) => string
  xFormat?: (v: number) => string
}

export function Chart(p: ChartProps) {
  const W = 640
  const H = p.height || 260
  const m = { l: 52, r: 12, t: 10, b: 36 }
  const { xd, yd } = useMemo(() => {
    const xs: number[] = []
    const ys: number[] = []
    for (const s of p.series || []) for (const [x, y] of s.points) if (Number.isFinite(y)) (xs.push(x), ys.push(y))
    for (const d of p.dots || []) (xs.push(d.x), ys.push(d.y))
    for (const b of p.bars || []) (xs.push(b.x0, b.x1), ys.push(0, b.y))
    for (const h of p.hLines || []) ys.push(h.y)
    let xd = p.xDomain || [Math.min(...xs), Math.max(...xs)]
    let yd = p.yDomain || [Math.min(...ys), Math.max(...ys)]
    if (!(xd[1] > xd[0])) xd = [xd[0] - 1, xd[0] + 1]
    if (!(yd[1] > yd[0])) yd = [yd[0] - 1, yd[0] + 1]
    if (!p.yDomain) {
      const pad = (yd[1] - yd[0]) * 0.06
      yd = [yd[0] - pad, yd[1] + pad]
    }
    return { xd, yd }
  }, [p.series, p.dots, p.bars, p.hLines, p.xDomain, p.yDomain])
  const sx = (x: number) => m.l + ((x - xd[0]) / (xd[1] - xd[0])) * (W - m.l - m.r)
  const sy = (y: number) => H - m.b - ((y - yd[0]) / (yd[1] - yd[0])) * (H - m.t - m.b)
  const fy = p.yFormat || ((v: number) => fmt(v, Math.abs(yd[1] - yd[0]) < 5 ? 2 : 0))
  const fx = p.xFormat || ((v: number) => fmt(v, Math.abs(xd[1] - xd[0]) < 5 ? 1 : 0))

  const toData = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const py = ((e.clientY - r.top) / r.height) * H
    return [xd[0] + ((px - m.l) / (W - m.l - m.r)) * (xd[1] - xd[0]), yd[0] + ((H - m.b - py) / (H - m.t - m.b)) * (yd[1] - yd[0])] as const
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none"
        style={{ touchAction: p.onPointer ? 'none' : undefined }}
        role="img"
        aria-label={`${p.yLabel || ''} mod ${p.xLabel || ''}`}
        onPointerDown={p.onPointer && ((e) => (e.currentTarget.setPointerCapture(e.pointerId), p.onPointer!(...toData(e), 'down')))}
        onPointerMove={p.onPointer && ((e) => p.onPointer!(...toData(e), 'move'))}
        onPointerUp={p.onPointer && ((e) => p.onPointer!(...toData(e), 'up'))}
      >
        {niceTicks(yd[0], yd[1]).map((t) => (
          <g key={`y${t}`}>
            <line x1={m.l} x2={W - m.r} y1={sy(t)} y2={sy(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={m.l - 6} y={sy(t) + 4} fontSize={11} textAnchor="end">
              {fy(t)}
            </text>
          </g>
        ))}
        {niceTicks(xd[0], xd[1], 6)
          .filter((t, i, a) => i === 0 || fx(t) !== fx(a[i - 1])) // no duplicate labels after rounding
          .map((t) => (
            <text key={`x${t}`} x={sx(t)} y={H - m.b + 16} fontSize={11} textAnchor="middle">
              {fx(t)}
            </text>
          ))}
        <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke="var(--muted)" />
        <line x1={m.l} x2={m.l} y1={m.t} y2={H - m.b} stroke="var(--muted)" />
        {yd[0] < 0 && yd[1] > 0 && <line x1={m.l} x2={W - m.r} y1={sy(0)} y2={sy(0)} stroke="var(--muted)" strokeDasharray="3 3" />}
        {(p.bars || []).map((b, i) => (
          <rect key={i} x={sx(b.x0) + 0.5} width={Math.max(0, sx(b.x1) - sx(b.x0) - 1)} y={sy(Math.max(b.y, 0))} height={Math.abs(sy(b.y) - sy(0))} fill={b.color || PALETTE[1]} opacity={0.75} />
        ))}
        {(p.hLines || []).map((h, i) => (
          <g key={`h${i}`}>
            <line x1={m.l} x2={W - m.r} y1={sy(h.y)} y2={sy(h.y)} stroke={h.color || 'var(--muted)'} strokeDasharray="5 4" strokeWidth={1.5} />
            {h.label && (
              <text x={W - m.r - 4} y={sy(h.y) - 4} fontSize={11} textAnchor="end" style={{ fill: h.color || 'var(--muted)' }}>
                {h.label}
              </text>
            )}
          </g>
        ))}
        {(p.vLines || []).map((v, i) => (
          <g key={`v${i}`}>
            <line x1={sx(v.x)} x2={sx(v.x)} y1={m.t} y2={H - m.b} stroke={v.color || 'var(--muted)'} strokeDasharray="5 4" strokeWidth={1.5} />
            {v.label && (
              <text x={sx(v.x) + 4} y={m.t + 12} fontSize={11} style={{ fill: v.color || 'var(--muted)' }}>
                {v.label}
              </text>
            )}
          </g>
        ))}
        {(p.series || []).map((s, i) => (
          <path
            key={i}
            d={s.points
              .filter(([, y]) => Number.isFinite(y))
              .map(([x, y], j) => `${j ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`)
              .join('')}
            fill="none"
            stroke={s.color || PALETTE[i % PALETTE.length]}
            strokeWidth={s.width || 2}
            strokeDasharray={s.dashed ? '6 4' : undefined}
            opacity={s.opacity ?? 1}
          />
        ))}
        {(p.dots || []).map((d, i) => (
          <circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={d.r || 4} fill={d.color || PALETTE[0]} stroke="var(--surface)" strokeWidth={1}>
            {d.label && <title>{d.label}</title>}
          </circle>
        ))}
        {p.children?.(sx, sy)}
        {p.xLabel && (
          <text x={(m.l + W - m.r) / 2} y={H - 4} fontSize={12} textAnchor="middle">
            {p.xLabel}
          </text>
        )}
        {p.yLabel && (
          <text x={12} y={(m.t + H - m.b) / 2} fontSize={12} textAnchor="middle" transform={`rotate(-90 12 ${(m.t + H - m.b) / 2})`}>
            {p.yLabel}
          </text>
        )}
      </svg>
      {p.legend && (
        <div className="mt-1 flex flex-wrap gap-3 text-xs">
          {(p.series || [])
            .filter((s) => s.label)
            .map((s, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="inline-block h-0.5 w-4" style={{ background: s.color || PALETTE[i % PALETTE.length] }} /> {s.label}
              </span>
            ))}
        </div>
      )}
    </div>
  )
}

export function Buttons<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          className="btn"
          style={value === o.id ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
