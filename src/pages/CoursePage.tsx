import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { loadCourse } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useSetting, useTable } from '@/lib/store'
import { weekProgress, type WeekProgress } from '@/lib/progress'
import { computeMastery, masteryLevel, MASTERY_LEVEL_LABEL, MASTERY_LEVELS, type MasteryLevel } from '@/lib/mastery'
import { placementKey, type PlacementRecord } from '@/lib/placement'
import { Html } from '@/components/Html'
import { courseStyle, Crumbs, ErrorBox, Loading, type Position, useTrackPosition } from '@/components/ui'
import type { CourseData } from '@/types/content'

type NodeState = 'done' | 'known' | 'current' | 'started' | 'later'

export default function CoursePage() {
  const { slug = '' } = useParams()
  const { data: course, error } = useAsync(() => loadCourse(slug), [slug])
  const checks = useTable('checks')
  const attempts = useTable('attempts')
  const checkMap = useMemo(() => new Map((checks || []).map((c) => [c.id, c.value])), [checks])
  const [placement, , placementLoaded] = useSetting<PlacementRecord | null>(placementKey(slug), null)
  const [position] = useSetting<Position | null>('position', null)
  const [showIntro, setShowIntro] = useState(false)
  useTrackPosition(course ? { path: `/kursus/${slug}`, label: course.meta.title, course: slug } : null)

  if (error) return <ErrorBox error={error} />
  if (!course || !attempts) return <Loading what="kursus" />
  const now = Date.now()
  const courseAttempts = attempts.filter((a) => a.course === slug)
  const progress = course.weeks.map((w) => weekProgress(course, w.number, checkMap, attempts))
  const known = new Set(Object.entries(placement?.results || {}).filter(([, r]) => r === 'known').map(([w]) => Number(w)))
  const started = (p: WeekProgress) => p.videosDone + p.exercisesDone + p.checkpointDone > 0
  // Where to go next: where you were in this course, else the first week that is neither done nor known.
  const here = position?.course === slug && position.week ? position.week : undefined
  const next = here ?? course.weeks.find((w, i) => !progress[i].done && !known.has(w.number))?.number ?? 1
  const state = (n: number): NodeState => {
    const p = progress[n - 1]
    if (p.done) return 'done'
    if (n === next) return 'current'
    if (known.has(n)) return 'known'
    return started(p) ? 'started' : 'later'
  }
  const fresh = !courseAttempts.length && !progress.some(started)

  return (
    <div className="course-theme mx-auto max-w-3xl space-y-6" style={courseStyle(course.meta.color)}>
      <Crumbs items={[{ to: '/kurser', label: 'Kurser' }, { label: course.meta.title }]} />
      <header className="space-y-3">
        <h1 className="page-title" dangerouslySetInnerHTML={{ __html: course.titleHtml }} />
        <p className="muted">
          {course.meta.level} · ca. {course.meta.estimated_weeks} uger · {course.counts.exercises} øvelser · {course.counts.videos} videoer
        </p>
        {course.meta.disclaimer && (
          <p className="rounded-xl px-4 py-2 text-sm" style={{ background: 'var(--warn-soft)' }}>
            {course.meta.disclaimer}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link className="btn btn-primary" to={`/kursus/${slug}/uge/${next}`}>
            {fresh && next === 1 ? 'Start uge 1' : `Fortsæt: uge ${next}`} →
          </Link>
          {course.subtitleHtml && (
            <button className="btn" onClick={() => setShowIntro((s) => !s)} aria-expanded={showIntro}>
              {showIntro ? 'Skjul introduktion' : 'Om kurset'}
            </button>
          )}
        </div>
      </header>

      {showIntro && course.subtitleHtml && (
        <section className="card fade-in">
          <Html html={course.subtitleHtml} className="reading" />
        </section>
      )}

      {placementLoaded && (
        <section className="card-flat flex flex-wrap items-center gap-3" style={{ background: 'var(--accent-soft)' }}>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{placement ? 'Hvad kan du allerede?' : 'Kan du noget af det allerede?'}</div>
            <p className="muted text-sm">
              {placement
                ? `Testen ${new Date(placement.date).toLocaleDateString('da-DK')}: ${known.size ? `${known.size} ${known.size === 1 ? 'uge' : 'uger'} markeret "Kan du allerede"` : 'du startede fra begyndelsen'}.`
                : 'Tag en kort test, så springer du over det, du allerede kan. Du kan også bare gå i gang.'}
            </p>
          </div>
          <Link className="btn shrink-0" to={`/kursus/${slug}/test`}>
            {placement ? 'Tag testen igen' : 'Tag testen'}
          </Link>
        </section>
      )}

      {/* ---------- course path */}
      <section aria-labelledby="path-h" className="space-y-3">
        <h2 id="path-h" className="section-title">
          Din vej gennem kurset
        </h2>
        <ol className="path">
          {course.weeks.map((w, i) => {
            const st = state(w.number)
            const p = progress[i]
            return (
              <li key={w.number} className={`path-node path-${st}`}>
                <span className="path-dot" aria-hidden>
                  {st === 'done' || st === 'known' ? '✓' : w.number}
                </span>
                <Link to={`/kursus/${slug}/uge/${w.number}`} className="path-card">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="muted text-xs font-semibold uppercase tracking-wide">Uge {w.number}</span>
                    {st === 'current' && <span className="path-tag">{here ? 'Du er her' : 'Næste'}</span>}
                    {st === 'known' && <span className="path-tag path-tag-ok">Kan du allerede</span>}
                    {st === 'done' && <span className="path-tag path-tag-ok">Gennemført</span>}
                  </div>
                  <div className="font-semibold">{w.title}</div>
                  {(st === 'current' || st === 'started') && (
                    <div className="muted mt-1 text-xs">
                      {p.videosDone}/{p.videos} videoer · {p.exercisesDone}/{p.exercises} øvelser · {p.checkpointDone}/{p.checkpoint} checkpoint
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
          {course.project && (
            <li className="path-node path-later">
              <span className="path-dot" aria-hidden>
                ★
              </span>
              <Link to={`/kursus/${slug}/projekt`} className="path-card">
                <span className="muted text-xs font-semibold uppercase tracking-wide">Afslutning</span>
                <div className="font-semibold">{course.project.title.replace(/^[^\p{L}]+/u, '')}</div>
              </Link>
            </li>
          )}
        </ol>
        <p className="muted text-xs">Rækkefølgen er en anbefaling — du kan åbne alle uger.</p>
      </section>

      <TopicMastery course={course} attempts={courseAttempts} now={now} />

      {course.tryIt.length > 0 && (
        <section className="card space-y-3" aria-labelledby="try-h">
          <h2 id="try-h" className="section-title">
            Prøv selv
          </h2>
          <p className="muted text-sm">Små værktøjer, du kan lege med. De står også i ugens kernebegreber, hvor de hører til.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {course.tryIt.map((t) => (
              <li key={t.id}>
                <Link to={`/kursus/${slug}/uge/${t.week}?fane=noter&prov=${t.id}`} className="block h-full rounded-xl p-3 hover:opacity-90" style={{ background: 'var(--surface-2)' }}>
                  <div className="font-medium">{t.title}</div>
                  <div className="muted text-xs">Uge {t.week}</div>
                  {t.intro && <div className="mt-1 text-sm" dangerouslySetInnerHTML={{ __html: t.intro }} />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card space-y-2">
        <h2 className="section-title">Mere i kurset</h2>
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {course.sets.map((s) => (
            <li key={s.slug}>
              <Link className="link" to={`/kursus/${slug}/saet/${s.slug}`}>
                {s.title} ({s.count} spørgsmål)
              </Link>
            </li>
          ))}
          <li>
            <Link className="link" to={`/ordliste?kursus=${slug}`}>
              Ordliste ({course.glossary.length} begreber)
            </Link>
          </li>
          {course.info.map((p) => (
            <li key={p.slug}>
              <Link className="link" to={`/kursus/${slug}/info/${p.slug}`}>
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function TopicMastery({ course, attempts, now }: { course: CourseData; attempts: import('@/lib/storage/types').Attempt[]; now: number }) {
  const rows = course.meta.topics.map((t) => {
    const m = computeMastery(attempts.filter((a) => a.topics.includes(t.id)), now)
    return { t, m, level: masteryLevel(m) }
  })
  const count = (l: MasteryLevel) => rows.filter((r) => r.level === l).length
  return (
    <section className="card space-y-3" aria-labelledby="mastery-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="mastery-h" className="section-title">
          Emner
        </h2>
        <div className="muted flex flex-wrap gap-3 text-xs">
          {MASTERY_LEVELS.map((l) => (
            <span key={l} className="flex items-center gap-1">
              <span className={`lvl lvl-${l}`} aria-hidden /> {MASTERY_LEVEL_LABEL[l]} ({count(l)})
            </span>
          ))}
        </div>
      </div>
      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map(({ t, level }) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <span className={`lvl lvl-${level}`} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{t.name}</span>
            <span className="muted shrink-0 text-xs">{MASTERY_LEVEL_LABEL[level]}</span>
            {level !== 'mestret' && level !== 'ikke-startet' && (
              <Link className="link shrink-0 text-xs" to={`/traen?kursus=${course.meta.slug}&emne=${t.id}&start=1`}>
                Træn
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
