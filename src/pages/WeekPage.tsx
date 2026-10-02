import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { loadCourse, loadWeek } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useCheck, useSetting, useStore, useTable } from '@/lib/store'
import { ANSWER_PREF_KEY, ANSWER_PREF_LABEL, filterByAnswerPref, type AnswerPref } from '@/lib/answer-type'
import { AnswerPrefPicker } from '@/components/AnswerPrefPicker'
import { checkpointId, visitId } from '@/lib/progress'
import { Html } from '@/components/Html'
import { VideoCard } from '@/components/VideoCard'
import { ExerciseCard, fromBank, STARS } from '@/components/ExerciseCard'
import { Crumbs, ErrorBox, Loading, useTrackPosition } from '@/components/ui'

const TABS = [
  { id: 'videoer', label: '📺 Se' },
  { id: 'noter', label: '🧠 Kernebegreber' },
  { id: 'oevelser', label: '✏️ Øvelser' },
  { id: 'checkpoint', label: '🏁 Checkpoint' },
] as const
type Tab = (typeof TABS)[number]['id']

export default function WeekPage() {
  const { slug = '', week = '1' } = useParams()
  const n = Number(week)
  const { data, error } = useAsync(async () => ({ course: await loadCourse(slug), week: await loadWeek(slug, n) }), [slug, n])
  const store = useStore()
  const [tab, setTab] = useState<Tab>('videoer')
  const [filter, setFilter] = useState<'alle' | '1' | '2' | '3' | 'kode' | 'ikke'>('alle')
  const attempts = useTable('attempts')
  const [pref, setPref] = useSetting<AnswerPref>(ANSWER_PREF_KEY, 'blandet')
  useEffect(() => {
    store.put('checks', { id: visitId(slug, n), value: true })
    setTab('videoer')
    setFilter('alle')
  }, [slug, n, store])
  useTrackPosition(data ? { path: `/kursus/${slug}/uge/${n}`, label: `${data.course.meta.title} · Uge ${n}: ${data.week.title}`, course: slug, week: n } : null)

  const tried = useMemo(() => new Set((attempts || []).filter((a) => a.course === slug && a.week === n).map((a) => a.exerciseId)), [attempts, slug, n])

  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading what="uge" />
  const { course, week: w } = data
  const prev = n > 1 ? n - 1 : null
  const next = n < course.weeks.length ? n + 1 : null
  const byPref = filterByAnswerPref(w.exercises, (e) => ({ choices: e.hasChoices, typed: true }), pref)
  const exercises = byPref.shown.filter((e) => {
    if (filter === 'alle') return true
    if (filter === 'kode') return e.kind === 'code'
    if (filter === 'ikke') return !tried.has(e.id)
    return String(e.difficulty) === filter
  })

  return (
    <div className="space-y-5">
      <Crumbs items={[{ to: '/kurser', label: 'Kurser' }, { to: `/kursus/${slug}`, label: course.meta.title }, { label: `Uge ${n}` }]} />
      <header className="space-y-3">
        <div className="muted text-sm font-semibold uppercase" style={{ color: course.meta.color }}>
          Uge {n} af {course.weeks.length}
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{w.title}</h1>
        <dl className="card grid gap-2 text-sm">
          {w.goals && (
            <div>
              <dt className="inline font-semibold">Læringsmål: </dt>
              <dd className="prose-content inline" dangerouslySetInnerHTML={{ __html: w.goals }} />
            </div>
          )}
          {w.time && (
            <div>
              <dt className="inline font-semibold">Tidsforbrug: </dt>
              <dd className="prose-content inline" dangerouslySetInnerHTML={{ __html: w.time }} />
            </div>
          )}
          {w.prereq && (
            <div>
              <dt className="inline font-semibold">Forudsætninger: </dt>
              <dd className="prose-content inline" dangerouslySetInnerHTML={{ __html: w.prereq }} />
            </div>
          )}
        </dl>
      </header>

      <div role="tablist" aria-label="Ugens dele" className="sticky top-[53px] z-20 -mx-4 flex gap-1 overflow-x-auto border-b px-4 py-2" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium"
            style={tab === t.id ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : { color: 'var(--muted)' }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'oevelser' && <span className="ml-1 opacity-70">({w.exercises.length})</span>}
          </button>
        ))}
      </div>

      {tab === 'videoer' && (
        <section className="space-y-4" role="tabpanel" aria-label="Videoer">
          {w.videosIntro && <Html html={w.videosIntro} className="card" />}
          {w.videos.map((v) => (
            <VideoCard key={v.id} course={slug} item={v} />
          ))}
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => (setTab('noter'), window.scrollTo(0, 0))}>
              Videre til kernebegreber →
            </button>
          </div>
        </section>
      )}

      {tab === 'noter' && (
        <section className="space-y-4" role="tabpanel" aria-label="Kernebegreber">
          <div className="card">
            <Html html={w.notes} />
          </div>
          {w.extraSections.map((s) => (
            <div key={s.title} className="card">
              <h2 className="mb-2 text-lg font-bold">{s.title}</h2>
              <Html html={s.html} />
            </div>
          ))}
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => (setTab('oevelser'), window.scrollTo(0, 0))}>
              Videre til øvelser →
            </button>
          </div>
        </section>
      )}

      {tab === 'oevelser' && (
        <section className="space-y-4" role="tabpanel" aria-label="Øvelser">
          {w.exercisesIntro && <Html html={w.exercisesIntro} className="card" />}
          <AnswerPrefPicker compact />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="muted">Vis:</span>
            {(
              [
                ['alle', 'Alle'],
                ['1', STARS[1]],
                ['2', STARS[2]],
                ['3', STARS[3]],
                ['kode', '💻'],
                ['ikke', 'Ikke prøvet'],
              ] as const
            ).map(([k, label]) => (
              <button key={k} className="btn" aria-pressed={filter === k} style={filter === k ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined} onClick={() => setFilter(k)}>
                {label}
              </button>
            ))}
            <span className="muted ml-auto">
              {tried.size}/{w.exercises.length} prøvet
            </span>
          </div>
          {exercises.map((e) => (
            <div key={e.id} id={`opgave-${e.number}`}>
              <ExerciseCard
                ex={fromBank(e)}
                heading={
                  <Link className="hover:underline" to={`/kursus/${slug}/uge/${n}/opgave/${e.number}`}>
                    Øvelse {e.number}
                  </Link>
                }
              />
            </div>
          ))}
          {byPref.hidden > 0 && (
            <p className="muted text-sm">
              {byPref.hidden} af ugens øvelser er skjult, fordi du har valgt "{ANSWER_PREF_LABEL[pref].toLowerCase()}".{' '}
              <button className="link" onClick={() => setPref('blandet')}>
                Vis alle
              </button>
            </p>
          )}
          {!exercises.length && <p className="muted">Ingen øvelser passer til det valgte.</p>}
        </section>
      )}

      {tab === 'checkpoint' && (
        <section className="space-y-4" role="tabpanel" aria-label="Checkpoint">
          {w.connection && (
            <div className="card">
              <h2 className="mb-2 text-lg font-bold">🔗 Forbindelse</h2>
              <Html html={w.connection} />
            </div>
          )}
          <div className="card space-y-3">
            <h2 className="text-lg font-bold">🏁 Checkpoint</h2>
            {w.checkpointIntro && <Html html={w.checkpointIntro} />}
            <ul className="space-y-2">
              {w.checkpoint.map((c, i) => (
                <CheckpointItem key={i} id={checkpointId(slug, n, i)} html={c} />
              ))}
            </ul>
          </div>
          <WeekNote course={slug} week={n} />
        </section>
      )}

      <nav className="flex justify-between gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }} aria-label="Uge-navigation">
        {prev ? (
          <Link className="btn" to={`/kursus/${slug}/uge/${prev}`}>
            ← Uge {prev}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn btn-primary" to={`/kursus/${slug}/uge/${next}`}>
            Uge {next}: {course.weeks[next - 1].title} →
          </Link>
        ) : (
          <Link className="btn btn-primary" to={course.project ? `/kursus/${slug}/projekt` : `/kursus/${slug}`}>
            {course.project ? 'Afsluttende projekt →' : 'Tilbage til kurset'}
          </Link>
        )}
      </nav>
    </div>
  )
}

function CheckpointItem({ id, html }: { id: string; html: string }) {
  const [on, set] = useCheck(id)
  return (
    <li>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" style={{ accentColor: 'var(--accent)' }} checked={on} onChange={(e) => set(e.target.checked)} />
        <span className="prose-content" style={on ? { opacity: 0.65 } : undefined} dangerouslySetInnerHTML={{ __html: html }} />
      </label>
    </li>
  )
}

function WeekNote({ course, week }: { course: string; week: number }) {
  const store = useStore()
  const id = `week:${course}/${week}`
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    store.get('notes', id).then((r) => setText(r?.text || ''))
  }, [store, id])
  useEffect(() => {
    if (text === null) return
    const t = setTimeout(() => store.put('notes', { id, text }), 500)
    return () => clearTimeout(t)
  }, [text, id, store])
  return (
    <div className="card space-y-2">
      <h2 className="font-bold">Mine noter til ugen</h2>
      <textarea className="input min-h-[6rem]" value={text ?? ''} onChange={(e) => setText(e.target.value)} placeholder="De tre vigtigste idéer med mine egne ord, hvad jeg ikke har forstået endnu …" aria-label="Mine noter til ugen" />
      <p className="muted text-xs">
        Tid brugt registreres i <Link className="link" to={`/logbog?kursus=${course}&uge=${week}`}>logbogen</Link>.
      </p>
    </div>
  )
}
