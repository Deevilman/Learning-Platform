import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useSetting, useTable } from '@/lib/store'
import { findWeakTopics } from '@/lib/weakness'
import { generators } from '@/lib/generators'
import { nextSteps, reachedWeeks, weekProgress } from '@/lib/progress'
import { CourseDot, ErrorBox, Loading, Progress, type Position } from '@/components/ui'
import { DailyGoal } from '@/components/DailyGoal'

function greeting(now: Date) {
  const h = now.getHours()
  return h < 10 ? 'Godmorgen' : h < 18 ? 'Hej' : 'Godaften'
}

export default function Dashboard() {
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
          <h1 className="page-title">{greeting(new Date(now))}!</h1>
          <p className="muted">{new Date(now).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <DailyGoal />
      </header>

      {/* 1. Fortsæt */}
      <section className="card space-y-4" aria-labelledby="cont-h">
        <h2 id="cont-h" className="section-title">
          {position ? 'Fortsæt hvor du slap' : 'Kom i gang'}
        </h2>
        {position ? (
          <>
            <div>
              <div className="text-lg font-medium">{position.label}</div>
              {wp && (
                <div className="mt-3 space-y-1">
                  <div className="muted flex justify-between text-sm">
                    <span>Ugens øvelser</span>
                    <span>
                      {wp.exercisesDone} af {wp.exercises}
                    </span>
                  </div>
                  <Progress value={wp.exercisesDone} max={wp.exercises} color={course?.meta.color} label="Ugens øvelser" />
                </div>
              )}
            </div>
            <Link className="btn btn-primary w-full sm:w-auto" to={position.path}>
              Fortsæt →
            </Link>
          </>
        ) : (
          <>
            <p>
              Begynd med <b>{first?.title}</b>. Du kan tage en kort test først, så du kan springe det over, du allerede kan.
            </p>
            <Link className="btn btn-primary w-full sm:w-auto" to={`/kursus/${first?.slug}`}>
              Start {first?.title} →
            </Link>
          </>
        )}
      </section>

      {/* 2. Træn mere på */}
      <section className="card space-y-3" aria-labelledby="weak-h">
        <h2 id="weak-h" className="section-title">
          Træn mere på
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
                    Træn
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="muted">Når du har lavet et par opgaver, viser jeg her, hvad du har mest gavn af at øve.</p>
        )}
        {due > 0 && (
          <Link className="link inline-block text-sm" to="/traen?tilstand=gennemgang">
            {due === 1 ? '1 opgave' : `${due} opgaver`} er klar til repetition i dag →
          </Link>
        )}
      </section>

      {/* 3. Næste skridt */}
      <section className="card space-y-3" aria-labelledby="next-h">
        <h2 id="next-h" className="section-title">
          Næste skridt
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
          Se din statistik →
        </Link>
      </p>
    </div>
  )
}
