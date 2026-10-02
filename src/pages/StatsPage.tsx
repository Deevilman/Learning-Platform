import { Link } from 'react-router-dom'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useTable } from '@/lib/store'
import { weekProgress } from '@/lib/progress'
import { computeMastery } from '@/lib/mastery'
import { DAY } from '@/lib/srs'
import { CourseDot, ErrorBox, Loading, Progress } from '@/components/ui'

function startOfWeek(now: number) {
  const d = new Date(now)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setHours(0, 0, 0, 0)
  return d.getTime() - day * DAY
}

export default function StatsPage() {
  const { data, error } = useAsync(async () => {
    const idx = await loadIndex()
    return { idx, courses: await Promise.all(idx.courses.map((c) => loadCourse(c.slug))) }
  }, [])
  const attempts = useTable('attempts')
  const checks = useTable('checks')
  const srs = useTable('srs')
  const logbook = useTable('logbook')
  if (error) return <ErrorBox error={error} />
  if (!data || !attempts || !checks || !srs || !logbook) return <Loading what="statistik" />

  const now = Date.now()
  const weekStart = startOfWeek(now)
  const checkMap = new Map(checks.map((c) => [c.id, c.value]))
  const weekAttempts = attempts.filter((a) => a.ts >= weekStart)
  const stats = [
    { label: 'videoer set', value: checks.filter((c) => c.value && c.id.startsWith('video:') && c.updatedAt >= weekStart).length },
    { label: 'opgaver lavet', value: new Set(weekAttempts.map((a) => a.exerciseId)).size },
    { label: 'rigtige svar', value: weekAttempts.filter((a) => a.score >= 0.66).length },
    { label: 'timer (logbog)', value: (logbook.filter((l) => new Date(l.date).getTime() >= weekStart - DAY / 2).reduce((s, l) => s + (l.minutes || 0), 0) / 60).toLocaleString('da-DK', { maximumFractionDigits: 1 }) },
  ]
  const exTitle = new Map(data.idx.exercises.map((e) => [e.id, e]))
  const due = srs.filter((c) => c.due <= now && exTitle.has(c.id)).sort((a, b) => a.due - b.due)
  const upcoming = srs.filter((c) => c.due > now && c.due < now + 7 * DAY && exTitle.has(c.id)).length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="page-title">Statistik</h1>

      <section className="card space-y-3">
        <h2 className="section-title">Denne uge</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="stat">
              <b>{s.value}</b>
              {s.label}
            </div>
          ))}
        </dl>
      </section>

      <section className="card space-y-3">
        <h2 className="section-title">Repetition</h2>
        <p>
          {due.length ? `${due.length} opgaver er klar til repetition i dag` : 'Ingen opgaver venter på repetition i dag.'}
          {upcoming > 0 && <span className="muted"> · {upcoming} mere i løbet af ugen</span>}
        </p>
        {due.length > 0 && (
          <Link className="btn btn-primary" to="/traen?tilstand=gennemgang">
            Start repetition
          </Link>
        )}
      </section>

      {data.courses.map((c) => {
        const done = c.weeks.filter((w) => weekProgress(c, w.number, checkMap, attempts).done).length
        const ca = attempts.filter((a) => a.course === c.meta.slug)
        return (
          <section key={c.meta.slug} className="card space-y-4">
            <h2 className="section-title flex items-center gap-2">
              <CourseDot color={c.meta.color} /> {c.meta.title}
            </h2>
            <div className="space-y-1">
              <div className="muted flex justify-between text-sm">
                <span>Uger gennemført</span>
                <span>
                  {done} af {c.weeks.length}
                </span>
              </div>
              <Progress value={done} max={c.weeks.length} color={c.meta.color} label={`Uger gennemført i ${c.meta.title}`} />
            </div>
            <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {c.meta.topics.map((t) => {
                const m = computeMastery(ca.filter((a) => a.topics.includes(t.id)), now)
                return (
                  <li key={t.id}>
                    <div className="flex justify-between text-sm">
                      <span>{t.name}</span>
                      <span className="muted">{m.attempts ? `${Math.round(m.mastery * 100)} %` : '–'}</span>
                    </div>
                    <Progress value={Math.round(m.mastery * 100)} max={100} color={c.meta.color} label={`Mestring: ${t.name}`} />
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
