import { Link } from 'react-router-dom'
import { Fragment, useMemo } from 'react'
import { loadIndex, loadCourse } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useTable } from '@/lib/store'
import { weekProgress } from '@/lib/progress'
import { courseMastery } from '@/lib/course-overview'
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

  const available = nodes.filter((n) => !n.planned)
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{t('courses.title')}</h1>
          <p className="muted">{t('courses.intro')}</p>
        </div>
        <Link className="btn shrink-0" to="/kurser/tilfoej">
          {t('courses.add')}
        </Link>
      </div>

      {/* ---------- the courses you can take now, big and simple */}
      <ul className="grid gap-4 sm:grid-cols-2">
        {available.map((n) => (
          <li key={n.slug}>
            <BigCourseCard node={n} course={data.courses.get(n.slug)!} title={title} checkMap={checkMap} attempts={attempts!} lang={lang} />
          </li>
        ))}
      </ul>

      {/* ---------- the map: every course by track, also those still to come */}
      <section className="space-y-4" aria-labelledby="map-h">
        <div className="space-y-1">
          <h2 id="map-h" className="section-title">
            {t('map.title')}
          </h2>
          <p className="muted text-sm">{t('map.intro')}</p>
        </div>
        <ul className="flex flex-wrap gap-2 text-xs" aria-label={t('map.legend')}>
          {(Object.keys(STATUS_LABEL) as CourseStatus[]).map((st) => (
            <li key={st} className="chip" style={STATUS_STYLE[st]}>
              {t(STATUS_LABEL[st])}
            </li>
          ))}
        </ul>
        {groupByTrack(nodes).map(({ track, layers }) => (
          <section key={track} className="space-y-2" aria-labelledby={`track-${track}`}>
            <h3 id={`track-${track}`} className="font-semibold">
              {trackName(track, t)}
            </h3>
            <ol className="course-map">
              {layers.map((layer, i) => (
                <Fragment key={i}>
                  {i > 0 && (
                    <li className="course-map-arrow" aria-hidden>
                      →
                    </li>
                  )}
                  <li className="course-map-layer">
                    <ul className="space-y-2">
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
      </section>
    </div>
  )
}

/** A course you can take: colour, title, how far you are, and one button. */
function BigCourseCard({ node: n, course: c, title, checkMap, attempts, lang }: { node: MapNode; course: CourseData; title: (s: string) => string; checkMap: Map<string, boolean>; attempts: import('@/lib/storage/types').Attempt[]; lang: 'da' | 'en' }) {
  const t = useT()
  const done = c.weeks.filter((w) => weekProgress(c, w.number, checkMap, attempts).done).length
  const mastery = courseMastery(c, attempts, Date.now())
  const started = n.status === 'started' || n.status === 'done'
  return (
    <Link to={`/kursus/${n.slug}`} className="course-tile">
      <div className="course-tile-band" style={{ background: c.meta.color }} aria-hidden />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="chip text-xs" style={STATUS_STYLE[n.status]}>
            {t(STATUS_LABEL[n.status])}
          </span>
          {c.meta.uploaded && <span className="chip text-xs">{t('courses.yours')}</span>}
          {n.meta && !hasLang(n.meta, lang) && <span className="chip text-xs">{t(n.meta.lang === 'en' ? 'courses.onlyEn' : 'courses.onlyDa')}</span>}
          {c.meta.exam === 'htx' && <span className="chip text-xs">htx</span>}
        </div>
        <h2 className="text-lg font-bold leading-snug">{c.meta.title}</h2>
        <p className="muted text-sm">{c.meta.short}</p>
        <p className="muted text-xs">{t('courses.size', { weeks: c.weeks.length, exercises: c.counts.exercises, videos: c.counts.videos })}</p>
        {n.requires.length > 0 && <p className="muted text-xs">{t('courses.buildsOn', { list: n.requires.map(title).join(', ') })}</p>}
        <div className="mt-auto space-y-1 pt-2">
          <div className="muted flex justify-between text-xs">
            <span>{t('courses.progress', { done, total: c.weeks.length })}</span>
            <span>{t('course.masteryPct', { n: mastery.percent })}</span>
          </div>
          <Progress value={done} max={c.weeks.length} color={c.meta.color} />
        </div>
        <span className="btn btn-primary mt-2 self-start" style={{ background: c.meta.color }}>
          {started ? t('courses.continue') : t('courses.start')}
        </span>
      </div>
    </Link>
  )
}

/** One course on the map: name and status; the ones you can take are links. */
function CourseCard({ node: n, course: c }: { node: MapNode; course?: CourseData; title: (s: string) => string; checkMap: Map<string, boolean>; attempts: import('@/lib/storage/types').Attempt[]; lang: 'da' | 'en' }) {
  const t = useT()
  const body = (
    <>
      {c ? <CourseDot color={c.meta.color} /> : <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border" style={{ borderColor: 'var(--border)' }} aria-hidden />}
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-snug">{n.title}</span>
        <span className="map-status" style={STATUS_STYLE[n.status]}>
          {t(STATUS_LABEL[n.status])}
        </span>
      </span>
    </>
  )
  return n.planned ? (
    <div className="map-node map-node-planned">{body}</div>
  ) : (
    <Link to={`/kursus/${n.slug}`} className="map-node">
      {body}
    </Link>
  )
}

const TRACKS: Record<string, Key> = { matematik: 'track.matematik', finans: 'track.finans', naturvidenskab: 'track.naturvidenskab', programmering: 'track.programmering', cyber: 'track.cyber' }
const trackName = (track: string, t: ReturnType<typeof useT>) => (TRACKS[track] ? t(TRACKS[track]) : track === 'andet' ? t('track.other') : track)
