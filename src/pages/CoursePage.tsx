import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { loadCourse } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useTable } from '@/lib/store'
import { weekProgress } from '@/lib/progress'
import { computeMastery } from '@/lib/mastery'
import { Html } from '@/components/Html'
import { Crumbs, ErrorBox, Loading, Progress, useTrackPosition } from '@/components/ui'

export default function CoursePage() {
  const { slug = '' } = useParams()
  const { data: course, error } = useAsync(() => loadCourse(slug), [slug])
  const checks = useTable('checks')
  const attempts = useTable('attempts')
  const checkMap = useMemo(() => new Map((checks || []).map((c) => [c.id, c.value])), [checks])
  const [showIntro, setShowIntro] = useState(false)
  useTrackPosition(course ? { path: `/kursus/${slug}`, label: course.meta.title, course: slug } : null)

  if (error) return <ErrorBox error={error} />
  if (!course) return <Loading what="kursus" />
  const now = Date.now()
  const courseAttempts = (attempts || []).filter((a) => a.course === slug)

  return (
    <div className="space-y-6">
      <Crumbs items={[{ to: '/kurser', label: 'Kurser' }, { label: course.meta.title }]} />
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl" dangerouslySetInnerHTML={{ __html: course.titleHtml }} />
        <p className="muted">
          {course.meta.level} · ca. {course.meta.estimated_weeks} uger · {course.counts.exercises} øvelser · {course.counts.videos} videoer
        </p>
        {course.meta.disclaimer && (
          <div className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
            ⚠️ {course.meta.disclaimer} Se ansvarsfraskrivelsen i introduktionen.
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link className="btn btn-primary" to={`/kursus/${slug}/uge/1`}>
            Start uge 1
          </Link>
          <Link className="btn" to={`/traen?kursus=${slug}`}>
            Træn dette kursus
          </Link>
          <button className="btn" onClick={() => setShowIntro((s) => !s)} aria-expanded={showIntro}>
            {showIntro ? 'Skjul introduktion' : 'Vis introduktion'}
          </button>
        </div>
      </header>
      {(showIntro || course.meta.disclaimer) && course.subtitleHtml && (
        <section className="card">
          <Html html={course.subtitleHtml} />
        </section>
      )}

      <section aria-labelledby="weeks-h">
        <h2 id="weeks-h" className="mb-3 text-lg font-bold">
          Uger
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {course.weeks.map((w) => {
            const p = weekProgress(course, w.number, checkMap, attempts || [])
            const m = computeMastery(courseAttempts.filter((a) => a.week === w.number), now)
            return (
              <li key={w.number}>
                <Link to={`/kursus/${slug}/uge/${w.number}`} className="card block transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="muted text-xs font-semibold uppercase">Uge {w.number}</div>
                      <div className="font-semibold">{w.title}</div>
                    </div>
                    {p.done && (
                      <span className="chip" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>
                        ✓ checkpoint
                      </span>
                    )}
                  </div>
                  <div className="muted mt-2 grid grid-cols-3 gap-2 text-xs">
                    <span>
                      📺 {p.videosDone}/{p.videos}
                    </span>
                    <span>
                      ✏️ {p.exercisesDone}/{p.exercises}
                    </span>
                    <span>
                      🏁 {p.checkpointDone}/{p.checkpoint}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress value={p.exercisesDone} max={p.exercises} color={course.meta.color} label={`Øvelser i uge ${w.number}`} />
                  </div>
                  {m.attempts > 0 && <div className="muted mt-1 text-xs">Mestring: {Math.round(m.mastery * 100)} %</div>}
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-2">
          <h2 className="font-bold">Mere i kurset</h2>
          <ul className="space-y-1.5 text-sm">
            {course.project && (
              <li>
                <Link className="link" to={`/kursus/${slug}/projekt`}>
                  🎓 {course.project.title.replace(/^[^\p{L}]+/u, '')}
                </Link>
              </li>
            )}
            {course.sets.map((s) => (
              <li key={s.slug}>
                <Link className="link" to={`/kursus/${slug}/saet/${s.slug}`}>
                  {s.slug === 'selftest' ? '🧪' : '🧠'} {s.title} ({s.count} spørgsmål)
                </Link>
              </li>
            ))}
            <li>
              <Link className="link" to={`/ordliste?kursus=${slug}`}>
                📖 Ordliste ({course.glossary.length} begreber)
              </Link>
            </li>
          </ul>
        </section>
        <section className="card space-y-2">
          <h2 className="font-bold">Info om planen</h2>
          <ul className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
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

      <section className="card">
        <h2 className="mb-3 font-bold">Emner og mestring</h2>
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {course.meta.topics.map((t) => {
            const m = computeMastery(courseAttempts.filter((a) => a.topics.includes(t.id)), now)
            return (
              <li key={t.id}>
                <div className="flex justify-between text-sm">
                  <span>{t.name}</span>
                  <span className="muted">{m.attempts ? `${Math.round(m.mastery * 100)} % · ${m.attempts} forsøg` : 'ikke øvet'}</span>
                </div>
                <Progress value={Math.round(m.mastery * 100)} max={100} color={course.meta.color} label={`Mestring: ${t.name}`} />
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
