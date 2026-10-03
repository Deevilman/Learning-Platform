import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useLang, useT } from '@/i18n'

export function Crumbs({ items }: { items: { to?: string; label: string }[] }) {
  const t = useT()
  return (
    <nav aria-label={t('app.crumbs')} className="muted mb-3 flex flex-wrap items-center gap-1 text-sm">
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

/** `what` is kept for call sites; the text is the same everywhere. */
export function Loading(_: { what?: string }) {
  const t = useT()
  return <p className="muted">{t('app.loading')}</p>
}

export function ErrorBox({ error }: { error: Error }) {
  const t = useT()
  return (
    <div className="card" style={{ borderColor: 'var(--bad)' }}>
      <b>{t('app.error')}</b> <span className="muted">{error.message}</span>
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

/** Wrapper style that gives a page its course's accent colour (see .course-theme). */
export const courseStyle = (color?: string): React.CSSProperties => (color ? ({ '--course': color } as React.CSSProperties) : {})

/** "This course is only available in Danish" when the course isn't in the learner's language. */
export function OnlyInNote({ meta }: { meta: { lang: 'da' | 'en' } }) {
  const t = useT()
  const [lang] = useLang()
  if (meta.lang === lang) return null
  return <p className="muted text-sm">{t(meta.lang === 'da' ? 'course.onlyDa' : 'course.onlyEn')}</p>
}
