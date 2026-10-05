import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useSetting, useTable } from '@/lib/store'
import { findWeakTopics } from '@/lib/weakness'
import { generators } from '@/lib/generators'
import { nextSteps, reachedWeeks, weekProgress } from '@/lib/progress'
import { courseMastery } from '@/lib/course-overview'
import { courseStarted } from '@/lib/course-map'
import { CourseDot, ErrorBox, Loading, Progress, type Position } from '@/components/ui'
import { BackupReminder } from '@/components/BackupReminder'
import { DailyGoal } from '@/components/DailyGoal'
import { dateLocale, useLang, useT, type T } from '@/i18n'

function greeting(now: Date, t: T) {
  const h = now.getHours()
  return h < 10 ? t('home.morning') : h < 18 ? t('home.hello') : t('home.evening')
}

export default function Dashboard() {
  const t = useT()
  const [lang] = useLang()
  const { data, error } = useAsync(async () => {
    const idx = await loadIndex()
    const courses = await Promise.all(idx.courses.map((c) => loadCourse(c.slug)))
    return { idx, courses: new Map(courses.map((c) => [c.meta.slug, c] as const)) }
  }, [])
  const attempts = useTable('attempts')
  const checks = useTable('checks')
  const srs = useTable('srs')
  const [position] = useSetting<Position | null>('position', null)
  const now = Date.now()

  const derived = useMemo(() => {
    if (!data || !attempts || !checks) return null
    const checkMap = new Map(checks.map((c) => [c.id, c.value]))
    const reached = reachedWeeks(attempts, checks)
    const weak = findWeakTopics(data.idx.courses, attempts, reached, now, 3)
    const steps = nextSteps(data.idx.courses, data.courses, checkMap, attempts, position?.course, now)
    return { checkMap, weak, steps }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, attempts, checks, position?.course])

  if (error) return <ErrorBox error={error} />
  if (!data || !derived) return <Loading what="overblik" />

  const known = new Set([...data.idx.exercises.map((e) => e.id), ...generators.map((g) => `gen:${g.id}`)])
  const due = (srs || []).filter((c) => c.due <= now && known.has(c.id)).length
  const course = position?.course ? data.courses.get(position.course) : undefined
  const wp = course && position?.week ? weekProgress(course, position.week, derived.checkMap, attempts || []) : null
  const first = data.idx.courses.find((c) => !c.prerequisites.length) || data.idx.courses[0]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{greeting(new Date(now), t)}!</h1>
          <p className="muted">{new Date(now).toLocaleDateString(dateLocale(lang), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <DailyGoal />
      </header>

      <BackupReminder />

      {/* 1. Fortsæt */}
      <section className="card space-y-4" aria-labelledby="cont-h">
        <h2 id="cont-h" className="section-title">
          {position ? t('home.continueTitle') : t('home.getStarted')}
        </h2>
        {position ? (
          <>
            <div>
              <div className="text-lg font-medium">{position.label}</div>
              {wp && (
                <div className="mt-3 space-y-1">
                  <div className="muted flex justify-between text-sm">
                    <span>{t('home.weekExercises')}</span>
                    <span>{t('placement.of', { n: wp.exercisesDone, total: wp.exercises })}</span>
                  </div>
                  <Progress value={wp.exercisesDone} max={wp.exercises} color={course?.meta.color} label={t('home.weekExercises')} />
                </div>
              )}
            </div>
            <Link className="btn btn-primary w-full sm:w-auto" to={position.path}>
              {t('home.continue')}
            </Link>
          </>
        ) : (
          <>
            <p>
              {t('home.beginWith')} <b>{first?.title}</b>. {t('home.testFirst')}
            </p>
            <Link className="btn btn-primary w-full sm:w-auto" to={`/kursus/${first?.slug}`}>
              {t('home.start', { title: first?.title || '' })}
            </Link>
          </>
        )}
      </section>

      {/* 2. Mine kurser: how far you are in each, one tap away */}
      <section className="card space-y-3" aria-labelledby="mine-h">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="mine-h" className="section-title">
            {t('home.myCourses')}
          </h2>
          <Link className="link text-sm" to="/kurser">
            {t('home.allCourses')}
          </Link>
        </div>
        <ul className="space-y-2">
          {[...data.courses.values()]
            .map((c) => ({ c, started: courseStarted(c, derived.checkMap, attempts || []) }))
            .sort((a, b) => Number(b.started) - Number(a.started))
            .map(({ c, started }) => {
              const done = c.weeks.filter((w) => weekProgress(c, w.number, derived.checkMap, attempts || []).done).length
              const m = courseMastery(c, attempts || [], now)
              return (
                <li key={c.meta.slug}>
                  <Link to={`/kursus/${c.meta.slug}`} className="block rounded-xl border p-3 hover:opacity-90" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <CourseDot color={c.meta.color} />
                      <span className="min-w-0 flex-1 font-medium leading-snug">{c.meta.title}</span>
                    </div>
                    <div className="mt-2">
                      <Progress value={done} max={c.weeks.length} color={c.meta.color} label={c.meta.title} />
                    </div>
                    <div className="muted mt-1 text-xs">{started ? t('home.courseState', { done, total: c.weeks.length, pct: m.percent }) : t('home.notStarted')}</div>
                  </Link>
                </li>
              )
            })}
        </ul>
      </section>

      {/* 3. Træn mere på */}
      <section className="card space-y-3" aria-labelledby="weak-h">
        <h2 id="weak-h" className="section-title">
          {t('home.practiseMore')}
        </h2>
        {derived.weak.length ? (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {derived.weak.map((w) => {
              const c = data.courses.get(w.course)!
              return (
                <li key={`${w.course}/${w.topic}`} className="flex items-center gap-3 py-3" style={{ borderColor: 'var(--border)' }}>
                  <CourseDot color={c.meta.color} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{w.name}</div>
                    <div className="muted truncate text-sm">{w.reasons[0]}</div>
                  </div>
                  <Link className="btn shrink-0" to={`/traen?kursus=${w.course}&emne=${w.topic}&start=1`}>
                    {t('nav.train')}
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="muted">{t('home.weakEmpty')}</p>
        )}
        {due > 0 && (
          <Link className="link inline-block text-sm" to="/traen?tilstand=gennemgang">
            {t(due === 1 ? 'home.dueOne' : 'home.due', { n: due })}
          </Link>
        )}
      </section>

      {/* 4. Næste skridt */}
      <section className="card space-y-3" aria-labelledby="next-h">
        <h2 id="next-h" className="section-title">
          {t('home.nextSteps')}
        </h2>
        <ul className="space-y-2">
          {derived.steps.slice(0, 3).map((s, i) => {
            const c = data.courses.get(s.course)
            const to = s.kind === 'week' ? `/kursus/${s.course}/uge/${s.week}` : c ? `/kursus/${s.course}` : '/kurser'
            return (
              <li key={i}>
                <Link to={to} className="flex items-center gap-3 rounded-xl p-3 hover:opacity-90" style={{ background: 'var(--surface-2)' }}>
                  {c && <CourseDot color={c.meta.color} />}
                  <div className="min-w-0">
                    <div className="truncate font-medium">{s.title}</div>
                    <div className="muted text-sm">{s.reason}</div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <p className="text-center">
        <Link className="link" to="/statistik">
          {t('home.seeStats')}
        </Link>
      </p>
    </div>
  )
}
