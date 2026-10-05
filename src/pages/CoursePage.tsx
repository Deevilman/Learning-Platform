import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { loadCourse } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useSetting, useTable } from '@/lib/store'
import { computeMastery, masteryLevel, MASTERY_LEVEL_LABEL, MASTERY_LEVELS, type MasteryLevel } from '@/lib/mastery'
import { courseMastery, nextItem, unitSummaries, type UnitItem, type UnitSummary } from '@/lib/course-overview'
import { placementKey, type PlacementRecord } from '@/lib/placement'
import { Html } from '@/components/Html'
import { NextCourses, PrerequisiteNote } from '@/components/CourseNeighbours'
import { dateLocale, useLang, useT } from '@/i18n'
import { courseStyle, Crumbs, OnlyInNote, ErrorBox, Loading, type Position, useTrackPosition } from '@/components/ui'
import type { CourseData } from '@/types/content'
import type { Key } from '@/i18n'

type NodeState = 'done' | 'known' | 'current' | 'started' | 'later'

export default function CoursePage() {
  const { slug = '' } = useParams()
  const t = useT()
  const [lang] = useLang()
  const { data: course, error } = useAsync(() => loadCourse(slug), [slug])
  const checks = useTable('checks')
  const attempts = useTable('attempts')
  const settings = useTable('settings')
  const checkMap = useMemo(() => new Map((checks || []).map((c) => [c.id, c.value])), [checks])
  const settingMap = useMemo(() => new Map((settings || []).map((s) => [s.id, s.value])), [settings])
  const [placement, , placementLoaded] = useSetting<PlacementRecord | null>(placementKey(slug), null)
  const [position] = useSetting<Position | null>('position', null)
  const [showIntro, setShowIntro] = useState(false)
  useTrackPosition(course ? { path: `/kursus/${slug}`, label: course.meta.title, course: slug } : null)

  if (error) return <ErrorBox error={error} />
  if (!course || !attempts || !settings) return <Loading what="kursus" />
  const now = Date.now()
  const courseAttempts = attempts.filter((a) => a.course === slug)
  const units = unitSummaries(course, checkMap, attempts, settingMap)
  const mastery = courseMastery(course, attempts, now)
  const known = new Set(Object.entries(placement?.results || {}).filter(([, r]) => r === 'known').map(([w]) => Number(w)))
  // Where to go next: where you were in this course, else the first week that is neither done nor known.
  const here = position?.course === slug && position.week ? position.week : undefined
  const next = here ?? course.weeks.find((w, i) => !units[i].done && !known.has(w.number))?.number ?? 1
  const state = (u: UnitSummary): NodeState => {
    if (u.done) return 'done'
    if (u.week === next) return 'current'
    if (known.has(u.week)) return 'known'
    return u.started ? 'started' : 'later'
  }
  const fresh = !courseAttempts.length && !units.some((u) => u.started)
  const nextUnit = units[next - 1] || units[0]
  const upNext = nextItem(nextUnit)
  const itemLabel = (it: UnitItem) => t(ITEM_LABEL[it.kind], { n: it.n ?? 0 })

  return (
    <div className="course-theme mx-auto grid max-w-5xl gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]" style={courseStyle(course.meta.color)}>
      {/* ---------- the weeks at a glance (wide screens) */}
      <aside className="hidden lg:block" aria-label={t('course.weeksNav')}>
        <nav className="sticky top-20 space-y-1">
          <div className="muted px-2 pb-1 text-xs font-semibold uppercase tracking-wide">{t('course.weeksNav')}</div>
          {units.map((u) => (
            <a key={u.week} href={`#enhed-${u.week}`} onClick={(e) => (e.preventDefault(), document.getElementById(`enhed-${u.week}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))} className={`unit-nav ${u.week === next ? 'unit-nav-on' : ''}`}>
              <span className="unit-ring" style={{ '--p': `${Math.round(u.progress * 100)}%` } as React.CSSProperties} aria-hidden>
                {u.done ? '✓' : u.week}
              </span>
              <span className="min-w-0 flex-1 truncate">{u.title}</span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 space-y-6">
      <Crumbs items={[{ to: '/kurser', label: t('nav.courses') }, { label: course.meta.title }]} />
      <OnlyInNote meta={course.meta} />
      <PrerequisiteNote slug={slug} />
      <NextCourses slug={slug} />

      {/* ---------- overview: title, mastery, the one button that matters */}
      <header className="course-hero space-y-4">
        <div className="space-y-1">
          <h1 className="page-title" dangerouslySetInnerHTML={{ __html: course.titleHtml }} />
          <p className="muted text-sm">
            {t('course.facts', { level: course.meta.level, weeks: course.meta.estimated_weeks, exercises: course.counts.exercises, videos: course.counts.videos })}
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold">{t('course.mastery')}</span>
            <span className="font-bold" style={{ color: 'var(--accent)' }}>
              {t('course.masteryPct', { n: mastery.percent })}
            </span>
          </div>
          <div className="mastery-bar" role="img" aria-label={MASTERY_LEVELS.map((l) => `${t(MASTERY_LEVEL_LABEL[l])}: ${mastery.counts[l]}`).join(', ')}>
            {(['mestret', 'kendt', 'oevet'] as MasteryLevel[]).map((l) =>
              mastery.counts[l] ? <span key={l} className={`mastery-seg mastery-${l}`} style={{ flexGrow: mastery.counts[l] }} /> : null,
            )}
            {mastery.counts['ikke-startet'] ? <span className="mastery-seg" style={{ flexGrow: mastery.counts['ikke-startet'] }} /> : null}
          </div>
          <div className="muted flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {MASTERY_LEVELS.map((l) => (
              <span key={l} className="flex items-center gap-1">
                <span className={`lvl lvl-${l}`} aria-hidden /> {t(MASTERY_LEVEL_LABEL[l])} {mastery.counts[l]}
              </span>
            ))}
          </div>
        </div>
        {course.meta.disclaimer && (
          <p className="rounded-xl px-4 py-2 text-sm" style={{ background: 'var(--warn-soft)' }}>
            {course.meta.disclaimer}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn btn-primary" to={`/kursus/${slug}/uge/${next}`}>
            {fresh && next === 1 ? t('course.start') : t('course.continue', { n: next })}
          </Link>
          {placementLoaded && (
            <Link className="btn" to={`/kursus/${slug}/test`}>
              {placement ? t('course.retest') : t('course.test')}
            </Link>
          )}
          {course.meta.exam && (
            <Link className="btn" to={`/kursus/${slug}/eksamen`}>
              {t(course.meta.exam === 'olympiade' ? 'exam.olympiadTitle' : 'exam.courseButton')}
            </Link>
          )}
          {course.subtitleHtml && (
            <button className="btn btn-quiet" onClick={() => setShowIntro((s) => !s)} aria-expanded={showIntro}>
              {showIntro ? t('course.hideIntro') : t('course.about')}
            </button>
          )}
        </div>
        {placementLoaded && (
          <p className="muted text-xs">
            {placement
              ? t('placement.last', { date: new Date(placement.date).toLocaleDateString(dateLocale(lang)), result: known.size ? t(known.size === 1 ? 'placement.knownOne' : 'placement.known', { n: known.size }) : t('placement.fromStart') })
              : t('placement.offer')}
          </p>
        )}
      </header>

      {showIntro && course.subtitleHtml && (
        <section className="card fade-in">
          <Html html={course.subtitleHtml} className="reading" />
        </section>
      )}

      {/* ---------- up next: exactly where to go */}
      <Link to={`/kursus/${slug}/uge/${nextUnit.week}?fane=${upNext.page}`} className="up-next">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
            {t('course.upNext')}
          </div>
          <div className="truncate font-semibold">{t('course.upNextItem', { n: nextUnit.week, item: itemLabel(upNext) })}</div>
          <div className="muted truncate text-sm">{nextUnit.title}</div>
        </div>
        <span className="btn btn-primary shrink-0" aria-hidden>
          {t(upNext.done > 0 || nextUnit.started ? 'course.goOn' : 'course.go')}
        </span>
      </Link>

      {/* ---------- course path */}
      <section aria-labelledby="path-h" className="space-y-3">
        <h2 id="path-h" className="section-title">
          {t('course.path')}
        </h2>
        <ol className="path">
          {units.map((u) => {
            const st = state(u)
            return (
              <li key={u.week} id={`enhed-${u.week}`} className={`path-node path-${st} scroll-mt-20`}>
                <span className="path-dot" aria-hidden>
                  {st === 'done' || st === 'known' ? '✓' : u.week}
                </span>
                <div className="path-card space-y-2">
                  <Link to={`/kursus/${slug}/uge/${u.week}`} className="block">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="muted text-xs font-semibold uppercase tracking-wide">{t('crumb.week', { n: u.week })}</span>
                      {st === 'current' && <span className="path-tag">{here ? t('course.here') : t('course.next')}</span>}
                      {st === 'known' && <span className="path-tag path-tag-ok">{t('course.alreadyKnown')}</span>}
                      {st === 'done' && <span className="path-tag path-tag-ok">{t('course.done')}</span>}
                      {u.started && !u.done && <span className="muted ml-auto text-xs">{t('course.unitPct', { n: Math.round(u.progress * 100) })}</span>}
                    </div>
                    <div className="font-semibold">{u.title}</div>
                  </Link>
                  <ul className="unit-items" aria-label={t('course.unitPages', { n: u.week })}>
                    {u.items.map((it) => (
                      <li key={it.page}>
                        <Link
                          to={`/kursus/${slug}/uge/${u.week}?fane=${it.page}`}
                          className={`unit-item unit-${it.kind} ${it.done >= 1 ? 'unit-done' : it.done > 0 ? 'unit-part' : ''}`}
                          title={itemLabel(it)}
                          aria-label={`${itemLabel(it)}: ${t(it.done >= 1 ? 'course.itemDone' : it.done > 0 ? 'course.itemStarted' : 'course.itemTodo')}`}
                        >
                          <span aria-hidden>{ITEM_ICON[it.kind]}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            )
          })}
          {course.project && (
            <li className="path-node path-later">
              <span className="path-dot" aria-hidden>
                ★
              </span>
              <Link to={`/kursus/${slug}/projekt`} className="path-card">
                <span className="muted text-xs font-semibold uppercase tracking-wide">{t('course.finale')}</span>
                <div className="font-semibold">{course.project.title.replace(/^[^\p{L}]+/u, '')}</div>
              </Link>
            </li>
          )}
        </ol>
        <p className="muted text-xs">{t('course.orderNote')}</p>
      </section>

      <TopicMastery course={course} attempts={courseAttempts} now={now} />

      {course.tryIt.length > 0 && (
        <details className="card space-y-3">
          <summary className="cursor-pointer">
            <span className="section-title">{t('nav.tryIt')}</span> <span className="muted text-sm">({course.tryIt.length})</span>
          </summary>
          <p className="muted mt-3 text-sm">{t('course.tryItIntro')}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {course.tryIt.map((it) => (
              <li key={it.id}>
                <Link to={`/kursus/${slug}/uge/${it.week}?fane=laes&prov=${it.id}`} className="block h-full rounded-xl p-3 hover:opacity-90" style={{ background: 'var(--surface-2)' }}>
                  <div className="font-medium">{it.title}</div>
                  <div className="muted text-xs">{t('crumb.week', { n: it.week })}</div>
                  {it.intro && <div className="mt-1 text-sm" dangerouslySetInnerHTML={{ __html: it.intro }} />}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}

      <section className="card space-y-2">
        <h2 className="section-title">{t('course.more')}</h2>
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {course.sets.map((s) => (
            <li key={s.slug}>
              <Link className="link" to={`/kursus/${slug}/saet/${s.slug}`}>
                {t('course.setCount', { title: s.title, n: s.count })}
              </Link>
            </li>
          ))}
          {course.challenges?.length ? (
            <li>
              <Link className="link" to="/udfordringer">
                {t('ctf.courseLink', { n: course.challenges.length })}
              </Link>
            </li>
          ) : null}
          {course.problems?.length ? (
            <li>
              <Link className="link" to={`/kode?kursus=${slug}`}>
                {t('code.courseLink', { n: course.problems.length })}
              </Link>
            </li>
          ) : null}
          {course.flashcards?.length ? (
            <li>
              <Link className="link" to={`/kort?kursus=${slug}`}>
                {t('cards.courseLink', { n: course.flashcards.length })}
              </Link>
            </li>
          ) : null}
          <li>
            <Link className="link" to={`/ordliste?kursus=${slug}`}>
              {t('course.glossaryCount', { n: course.glossary.length })}
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
    </div>
  )
}

const ITEM_LABEL: Record<UnitItem['kind'], Key> = { video: 'week.video', laes: 'week.read', oev: 'week.exercises', checkpoint: 'week.checkpoint' }
const ITEM_ICON: Record<UnitItem['kind'], string> = { video: '▶', laes: '¶', oev: '✎', checkpoint: '⚑' }

function TopicMastery({ course, attempts, now }: { course: CourseData; attempts: import('@/lib/storage/types').Attempt[]; now: number }) {
  const t = useT()
  const rows = course.meta.topics.map((topic) => {
    const m = computeMastery(attempts.filter((a) => a.topics.includes(topic.id)), now)
    return { topic, m, level: masteryLevel(m) }
  })
  const count = (l: MasteryLevel) => rows.filter((r) => r.level === l).length
  return (
    <section className="card space-y-3" aria-labelledby="mastery-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="mastery-h" className="section-title">
          {t('course.topics')}
        </h2>
        <div className="muted flex flex-wrap gap-3 text-xs">
          {MASTERY_LEVELS.map((l) => (
            <span key={l} className="flex items-center gap-1">
              <span className={`lvl lvl-${l}`} aria-hidden /> {t(MASTERY_LEVEL_LABEL[l])} ({count(l)})
            </span>
          ))}
        </div>
      </div>
      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map(({ topic, level }) => (
          <li key={topic.id} className="flex items-center gap-2 text-sm">
            <span className={`lvl lvl-${level}`} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{topic.name}</span>
            <span className="muted shrink-0 text-xs">{t(MASTERY_LEVEL_LABEL[level])}</span>
            {level !== 'mestret' && level !== 'ikke-startet' && (
              <Link className="link shrink-0 text-xs" to={`/traen?kursus=${course.meta.slug}&emne=${topic.id}&start=1`}>
                {t('nav.train')}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
