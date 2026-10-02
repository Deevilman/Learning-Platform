import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/lib/store'

export function Crumbs({ items }: { items: { to?: string; label: string }[] }) {
  return (
    <nav aria-label="Brødkrummer" className="muted mb-3 flex flex-wrap items-center gap-1 text-sm">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden>›</span>}
          {it.to ? (
            <Link className="hover:underline" to={it.to}>
              {it.label}
            </Link>
          ) : (
            <span aria-current="page">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function Loading({ what = 'indhold' }: { what?: string }) {
  return <p className="muted">Indlæser {what}…</p>
}

export function ErrorBox({ error }: { error: Error }) {
  return (
    <div className="card" style={{ borderColor: 'var(--bad)' }}>
      <b>Noget gik galt.</b> <span className="muted">{error.message}</span>
    </div>
  )
}

export function Progress({ value, max, color = 'var(--accent)', label }: { value: number; max: number; color?: string; label?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="w-full" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export interface Position {
  path: string
  label: string
  course?: string
  week?: number
  ts: number
}

/** Remember "where I left off" for the dashboard's Fortsæt button. */
export function useTrackPosition(p: Omit<Position, 'ts'> | null) {
  const store = useStore()
  const key = p ? `${p.path}|${p.label}` : ''
  useEffect(() => {
    if (!p) return
    store.put('settings', { id: 'position', value: { ...p, ts: Date.now() } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, store])
}

export function CourseDot({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
}
