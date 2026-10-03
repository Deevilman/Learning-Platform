import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { loadIndex, loadCourse } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useTable } from '@/lib/store'
import { weekProgress } from '@/lib/progress'
import { hasLang, useLang, useT } from '@/i18n'
import { CourseDot, ErrorBox, Loading, Progress } from '@/components/ui'

export default function Courses() {
  const { data, error } = useAsync(async () => {
    const idx = await loadIndex()
    const courses = await Promise.all(idx.courses.map((c) => loadCourse(c.slug)))
    return { idx, courses }
  }, [])
  const t = useT()
  const [lang] = useLang()
  const checks = useTable('checks')
  const attempts = useTable('attempts')
  const checkMap = useMemo(() => new Map((checks || []).map((c) => [c.id, c.value])), [checks])

  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading what="kurser" />
  // Topological order of the course graph (prerequisites first).
  const order = [...data.courses].sort((a, b) => depth(a.meta.slug) - depth(b.meta.slug))
  function depth(slug: string, seen = new Set<string>()): number {
    const c = data!.courses.find((x) => x.meta.slug === slug)
    if (!c || seen.has(slug)) return 0
    seen.add(slug)
    return c.meta.prerequisites.length ? 1 + Math.max(...c.meta.prerequisites.map((p) => depth(p, seen))) : 0
  }
  const known = new Set(data.courses.map((c) => c.meta.slug))
  const future = [...new Set(data.courses.flatMap((c) => c.meta.next).filter((n) => !known.has(n)))]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
        <h1 className="page-title">{t('courses.title')}</h1>
        <p className="muted">{t('courses.intro')}</p>
        </div>
        <Link className="btn shrink-0" to="/kurser/tilfoej">
          {t('courses.add')}
        </Link>
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {order.map((c, i) => {
          const done = c.weeks.filter((w) => weekProgress(c, w.number, checkMap, attempts || []).done).length
          return (
            <li key={c.meta.slug} className="relative">
              <Link to={`/kursus/${c.meta.slug}`} className="card block h-full transition-shadow hover:shadow-md" style={{ borderTop: `4px solid ${c.meta.color}` }}>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide muted">
                  <CourseDot color={c.meta.color} /> {t('courses.step', { n: i + 1 })}
                </div>
                <h2 className="text-lg font-bold">{c.meta.title}</h2>
                {c.meta.uploaded && <span className="chip">{t('courses.yours')}</span>}
                {!hasLang(data.idx.courses.find((m) => m.slug === c.meta.slug) || c.meta, lang) && <span className="chip">{t(c.meta.lang === 'en' ? 'courses.onlyEn' : 'courses.onlyDa')}</span>}
                <p className="muted text-sm">{c.meta.short}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="stat">
                    <b>{c.counts.weeks}</b>{t('courses.weeks')}
                  </div>
                  <div className="stat">
                    <b>{c.counts.exercises}</b>{t('courses.exercises')}
                  </div>
                  <div className="stat">
                    <b>{c.counts.videos}</b>{t('courses.videos')}
                  </div>
                </dl>
                <div className="mt-3 space-y-1">
                  <div className="muted flex justify-between text-xs">
                    <span>{t('courses.weeksDone')}</span>
                    <span>
                      {done}/{c.weeks.length}
                    </span>
                  </div>
                  <Progress value={done} max={c.weeks.length} color={c.meta.color} />
                </div>
                {c.meta.prerequisites.length > 0 && (
                  <p className="muted mt-3 text-xs">
                    {t('courses.buildsOn', { list: c.meta.prerequisites.map((p) => data.courses.find((x) => x.meta.slug === p)?.meta.title || p).join(', ') })}
                  </p>
                )}
                {c.meta.disclaimer && <p className="mt-2 text-xs" style={{ color: 'var(--warn)' }}>⚠️ {c.meta.disclaimer}</p>}
              </Link>
            </li>
          )
        })}
      </ol>
      {future.length > 0 && (
        <div className="card-flat">
          <h2 className="section-title">{t('courses.later')}</h2>
          <p className="muted text-sm">{future.join(', ')}</p>
        </div>
      )}
    </div>
  )
}
