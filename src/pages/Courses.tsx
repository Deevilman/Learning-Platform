import { Link } from 'react-router-dom'
import { Fragment, useMemo } from 'react'
import { loadIndex, loadCourse } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useTable } from '@/lib/store'
import { weekProgress } from '@/lib/progress'
import { buildCourseMap, groupByTrack, type CourseStatus, type MapNode } from '@/lib/course-map'
import { hasLang, useLang, useT, type Key } from '@/i18n'
import { CourseDot, ErrorBox, Loading, Progress } from '@/components/ui'
import type { CourseData } from '@/types/content'

export const STATUS_LABEL: Record<CourseStatus, Key> = { done: 'map.done', started: 'map.started', ready: 'map.ready', later: 'map.later', planned: 'map.planned' }
const STATUS_STYLE: Record<CourseStatus, React.CSSProperties> = {
  done: { background: 'var(--ok-soft)', color: 'var(--ok)' },
  started: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  ready: { background: 'var(--surface-2)', color: 'var(--text)' },
  later: { background: 'var(--warn-soft)', color: 'var(--text)' },
  planned: { background: 'var(--surface-2)', color: 'var(--muted)' },
}

/** "Kursuskort": every course by track, with where you are in each. Nothing is locked. */
export default function Courses() {
  const t = useT()
  const [lang] = useLang()
  const { data, error } = useAsync(async () => {
    const idx = await loadIndex()
    const courses = await Promise.all(idx.courses.map((c) => loadCourse(c.slug)))
    return { idx, courses: new Map(courses.map((c) => [c.meta.slug, c])) }
  }, [])
  const checks = useTable('checks')
  const attempts = useTable('attempts')
  const checkMap = useMemo(() => new Map((checks || []).map((c) => [c.id, c.value])), [checks])
  const nodes = useMemo(() => (data && attempts ? buildCourseMap(data.idx.courses, data.idx.planned || [], data.courses, checkMap, attempts, Date.now()) : null), [data, attempts, checkMap])

  if (error) return <ErrorBox error={error} />
  if (!data || !nodes) return <Loading what="kurser" />
  const title = (slug: string) => nodes.find((n) => n.slug === slug)?.title || slug

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{t('courses.title')}</h1>
          <p className="muted">{t('map.intro')}</p>
        </div>
        <Link className="btn shrink-0" to="/kurser/tilfoej">
          {t('courses.add')}
        </Link>
      </div>
      <ul className="flex flex-wrap gap-2 text-xs" aria-label={t('map.legend')}>
        {(Object.keys(STATUS_LABEL) as CourseStatus[]).map((s) => (
          <li key={s} className="chip" style={STATUS_STYLE[s]}>
            {t(STATUS_LABEL[s])}
          </li>
        ))}
      </ul>
      {groupByTrack(nodes).map(({ track, layers }) => (
        <section key={track} className="space-y-3" aria-labelledby={`track-${track}`}>
          <h2 id={`track-${track}`} className="section-title">
            {trackName(track, t)}
          </h2>
          <ol className="course-map">
            {layers.map((layer, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <li className="course-map-arrow" aria-hidden>
                    →
                  </li>
                )}
                <li className="course-map-layer">
                  <ul className="space-y-3">
                    {layer.map((n) => (
                      <li key={n.slug}>
                        <CourseCard node={n} course={data.courses.get(n.slug)} title={title} checkMap={checkMap} attempts={attempts!} lang={lang} />
                      </li>
                    ))}
                  </ul>
                </li>
              </Fragment>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

function CourseCard({ node: n, course: c, title, checkMap, attempts, lang }: { node: MapNode; course?: CourseData; title: (s: string) => string; checkMap: Map<string, boolean>; attempts: import('@/lib/storage/types').Attempt[]; lang: 'da' | 'en' }) {
  const t = useT()
  const done = c ? c.weeks.filter((w) => weekProgress(c, w.number, checkMap, attempts).done).length : 0
  const body = (
    <>
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        {c && <CourseDot color={c.meta.color} />}
        <span className="chip text-xs" style={STATUS_STYLE[n.status]}>
          {t(STATUS_LABEL[n.status])}
        </span>
        {c?.meta.uploaded && <span className="chip text-xs">{t('courses.yours')}</span>}
        {n.meta && !hasLang(n.meta, lang) && <span className="chip text-xs">{t(n.meta.lang === 'en' ? 'courses.onlyEn' : 'courses.onlyDa')}</span>}
        {n.meta?.exam === 'htx' || (n.planned && n.track === 'naturvidenskab') ? <span className="chip text-xs">htx</span> : null}
      </div>
      <h3 className="font-bold">{n.title}</h3>
      {c && <p className="muted text-sm">{c.meta.short}</p>}
      {c && (
        <div className="mt-2 space-y-1">
          <div className="muted flex justify-between text-xs">
            <span>{t('courses.weeksDone')}</span>
            <span>
              {done}/{c.weeks.length}
            </span>
          </div>
          <Progress value={done} max={c.weeks.length} color={c.meta.color} />
        </div>
      )}
      {n.requires.length > 0 && <p className="muted mt-2 text-xs">{t('courses.buildsOn', { list: n.requires.map(title).join(', ') })}</p>}
      {n.recommendedBefore.length > 0 && <p className="muted text-xs">{t('map.niceFirst', { list: n.recommendedBefore.map(title).join(', ') })}</p>}
      {c?.meta.disclaimer && <p className="mt-2 text-xs" style={{ color: 'var(--warn)' }}>⚠️ {c.meta.disclaimer}</p>}
    </>
  )
  return n.planned ? (
    <div className="card block opacity-75" style={{ borderTop: '4px dashed var(--border)' }}>
      {body}
    </div>
  ) : (
    <Link to={`/kursus/${n.slug}`} className="card block transition-shadow hover:shadow-md" style={{ borderTop: `4px solid ${c?.meta.color || 'var(--border)'}` }}>
      {body}
    </Link>
  )
}

const TRACKS: Record<string, Key> = { matematik: 'track.matematik', finans: 'track.finans', naturvidenskab: 'track.naturvidenskab', programmering: 'track.programmering', cyber: 'track.cyber' }
const trackName = (track: string, t: ReturnType<typeof useT>) => (TRACKS[track] ? t(TRACKS[track]) : track === 'andet' ? t('track.other') : track)
