import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useSetting, useTable } from '@/lib/store'
import { findWeakTopics } from '@/lib/weakness'
import { nextSteps, reachedWeeks, weekProgress } from '@/lib/progress'
import { DAY } from '@/lib/srs'
import { CourseDot, ErrorBox, Loading, Progress, type Position } from '@/components/ui'
import type { CourseData } from '@/types/content'

function startOfWeek(now: number) {
  const d = new Date(now)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setHours(0, 0, 0, 0)
  return d.getTime() - day * DAY
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
  const logbook = useTable('logbook')
  const [position] = useSetting<Position | null>('position', null)
  const now = Date.now()

  const derived = useMemo(() => {
    if (!data || !attempts || !checks) return null
    const checkMap = new Map(checks.map((c) => [c.id, c.value]))
    const reached = reachedWeeks(attempts, checks)
    const weak = findWeakTopics(data.idx.courses, attempts, reached, now, 5)
    const steps = nextSteps(data.idx.courses, data.courses, checkMap, attempts, position?.course, now)
    return { checkMap, weak, steps }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, attempts, checks, position?.course])

  if (error) return <ErrorBox error={error} />
  if (!data || !derived) return <Loading what="overblik" />

  const exTitle = new Map(data.idx.exercises.map((e) => [e.id, e]))
  const due = (srs || []).filter((c) => c.due <= now && exTitle.has(c.id)).sort((a, b) => a.due - b.due)
  const weekStart = startOfWeek(now)
  const weekAttempts = (attempts || []).filter((a) => a.ts >= weekStart)
  const weekVideos = (checks || []).filter((c) => c.value && c.id.startsWith('video:') && c.updatedAt >= weekStart).length
  const weekCheckpoints = (checks || []).filter((c) => c.value && c.id.startsWith('checkpoint:') && c.updatedAt >= weekStart).length
  const weekMinutes = (logbook || []).filter((l) => new Date(l.date).getTime() >= weekStart - DAY / 2).reduce((s, l) => s + (l.minutes || 0), 0)
  const currentCourse: CourseData | undefined = position?.course ? data.courses.get(position.course) : undefined
  const currentWeek = position?.week
  const cwp = currentCourse && currentWeek ? weekProgress(currentCourse, currentWeek, derived.checkMap, attempts || []) : null
  const isNew = !(attempts || []).length && !(checks || []).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Overblik</h1>
          <p className="muted">{new Date(now).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Link className="btn btn-primary" to="/traen">
          Træn nu →
        </Link>
      </div>

      {isNew && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <h2 className="text-lg font-bold">Velkommen! 👋</h2>
          <p className="mt-1">
            Start med <Link className="link" to="/kursus/foundations/uge/1">uge 1 i Matematikkens grundlag</Link>. Alt, hvad du gør, gemmes i browseren — og synkroniseres, hvis du logger ind under{' '}
            <Link className="link" to="/indstillinger">Indstillinger</Link>.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Fortsæt */}
        <section className="card lg:col-span-2" aria-labelledby="cont-h">
          <h2 id="cont-h" className="mb-2 font-bold">
            Fortsæt
          </h2>
          {position ? (
            <Link to={position.path} className="flex items-center justify-between gap-3 rounded-lg p-3 hover:opacity-90" style={{ background: 'var(--accent-soft)' }}>
              <div>
                <div className="font-semibold">{position.label}</div>
                <div className="muted text-xs">Sidst åbnet {new Date(position.ts).toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
              <span className="text-xl" aria-hidden>
                →
              </span>
            </Link>
          ) : (
            <p className="muted text-sm">Når du åbner en uge eller en øvelse, kan du fortsætte herfra.</p>
          )}
          {cwp && currentCourse && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="muted text-xs">Videoer i ugen</div>
                <Progress value={cwp.videosDone} max={cwp.videos} color={currentCourse.meta.color} />
                <div className="text-xs">
                  {cwp.videosDone}/{cwp.videos}
                </div>
              </div>
              <div>
                <div className="muted text-xs">Øvelser prøvet</div>
                <Progress value={cwp.exercisesDone} max={cwp.exercises} color={currentCourse.meta.color} />
                <div className="text-xs">
                  {cwp.exercisesDone}/{cwp.exercises}
                </div>
              </div>
              <div>
                <div className="muted text-xs">Checkpoint</div>
                <Progress value={cwp.checkpointDone} max={cwp.checkpoint} color={currentCourse.meta.color} />
                <div className="text-xs">
                  {cwp.checkpointDone}/{cwp.checkpoint}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Review queue */}
        <section className="card" aria-labelledby="due-h">
          <h2 id="due-h" className="mb-2 font-bold">
            Gennemgang i dag
          </h2>
          <p className="text-3xl font-bold">{due.length}</p>
          <p className="muted text-sm">{due.length === 1 ? 'øvelse er klar til repetition' : 'øvelser er klar til repetition'}</p>
          {due.length > 0 && (
            <>
              <ul className="mt-2 space-y-1 text-sm">
                {due.slice(0, 4).map((c) => {
                  const e = exTitle.get(c.id)!
                  return (
                    <li key={c.id} className="truncate">
                      <span className="muted">{e.course}</span> · {e.week ? `${e.number}` : `${e.set} ${e.number}`} {e.title}
                    </li>
                  )
                })}
              </ul>
              <Link className="btn btn-primary mt-3 w-full" to="/traen?tilstand=gennemgang">
                Start gennemgang
              </Link>
            </>
          )}
        </section>
      </div>

      {/* Weak topics */}
      <section className="card" aria-labelledby="weak-h">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 id="weak-h" className="font-bold">
            Træn mere på
          </h2>
          <Link className="link text-sm" to="/traen?tilstand=svage">
            Træn alle svage emner →
          </Link>
        </div>
        {derived.weak.length ? (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {derived.weak.map((w) => {
              const c = data.courses.get(w.course)!
              return (
                <li key={`${w.course}/${w.topic}`} className="flex flex-col gap-2 rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <CourseDot color={c.meta.color} />
                    <span className="font-semibold">{w.name}</span>
                  </div>
                  <div className="muted text-xs">{c.meta.title}</div>
                  <Progress value={Math.round(w.mastery.mastery * 100)} max={100} color={c.meta.color} label={`Mestring ${w.name}`} />
                  <ul className="text-sm">
                    {w.reasons.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                  <Link className="btn btn-primary mt-auto" to={`/traen?kursus=${w.course}&emne=${w.topic}&start=1`}>
                    Træn {w.name.toLowerCase()}
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="muted text-sm">Ingen svage emner endnu. Lav nogle øvelser, så finder platformen ud af, hvad du skal træne mere.</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly progress */}
        <section className="card" aria-labelledby="wk-h">
          <h2 id="wk-h" className="mb-3 font-bold">
            Denne uge
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="stat">
              <b>{weekVideos}</b>videoer set
            </div>
            <div className="stat">
              <b>{new Set(weekAttempts.map((a) => a.exerciseId)).size}</b>øvelser lavet
            </div>
            <div className="stat">
              <b>{weekCheckpoints}</b>checkpoint-punkter
            </div>
            <div className="stat">
              <b>{(weekMinutes / 60).toLocaleString('da-DK', { maximumFractionDigits: 1 })} t</b>tid (logbog)
            </div>
          </dl>
          <Link className="link mt-3 inline-block text-sm" to="/logbog">
            Skriv i logbogen →
          </Link>
        </section>

        {/* Next steps */}
        <section className="card" aria-labelledby="next-h">
          <h2 id="next-h" className="mb-3 font-bold">
            Næste skridt
          </h2>
          <ul className="space-y-2">
            {derived.steps.slice(0, 4).map((s, i) => {
              const c = data.courses.get(s.course)
              const to = s.kind === 'week' ? `/kursus/${s.course}/uge/${s.week}` : c ? `/kursus/${s.course}` : '/kurser'
              return (
                <li key={i}>
                  <Link to={to} className="flex items-center gap-3 rounded-lg border p-2.5 hover:opacity-90" style={{ borderColor: 'var(--border)' }}>
                    {c && <CourseDot color={c.meta.color} />}
                    <div className="min-w-0">
                      <div className="truncate font-medium">{s.title}</div>
                      <div className="muted text-xs">{s.reason}</div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
