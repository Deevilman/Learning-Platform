// "Hvad kan du allerede?" — a short, skippable placement test for one course.

import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { loadCourse, loadWeek } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useSetting, useStore } from '@/lib/store'
import { weekPool } from '@/lib/week-pool'
import { randomSeed } from '@/lib/rng'
import {
  answerPlacement,
  continuePlacement,
  currentQuestion,
  placementKey,
  placementResults,
  startPlacement,
  startWeek,
  totalQuestions,
  type PlacementRecord,
  type PlacementState,
  type WeekPool,
} from '@/lib/placement'
import { QuickQuestion } from '@/components/QuickQuestion'
import { courseStyle, Crumbs, ErrorBox, Loading, Progress } from '@/components/ui'
import type { CourseData, Exercise } from '@/types/content'

export default function PlacementPage() {
  const { slug = '' } = useParams()
  const { data, error } = useAsync(async () => {
    const course = await loadCourse(slug)
    const weeks = await Promise.all(course.weeks.map((w) => loadWeek(slug, w.number)))
    return { course, weeks }
  }, [slug])
  const [record, setRecord] = useSetting<PlacementRecord | null>(placementKey(slug), null)
  const [state, setState] = useState<PlacementState | null>(null)

  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading what="testen" />
  const { course, weeks } = data
  const quizById = new Map(weeks.flatMap((w) => w.exercises.filter((e) => e.quiz).map((e) => [e.id, e] as const)))

  const pools: WeekPool[] = course.weeks.map((w) => weekPool(course, w.number, weeks[w.number - 1].exercises))

  const begin = () => setState(startPlacement(pools, randomSeed()))

  return (
    <div className="course-theme mx-auto max-w-2xl space-y-5" style={courseStyle(data.course.meta.color)}>
      <Crumbs items={[{ to: '/kurser', label: 'Kurser' }, { to: `/kursus/${slug}`, label: course.meta.title }, { label: 'Hvad kan du allerede?' }]} />
      {!state ? (
        <Intro course={course} record={record} weeks={pools.length} onStart={begin} />
      ) : state.finished ? (
        <Result course={course} state={state} onContinue={() => setState(continuePlacement(state))} onSave={setRecord} />
      ) : (
        <Question key={totalQuestions(state)} course={course} state={state} quizById={quizById} onAnswer={(ok) => setState(answerPlacement(state, ok))} onStop={() => setState({ ...state, finished: true })} />
      )}
    </div>
  )
}

function Intro({ course, record, weeks, onStart }: { course: CourseData; record: PlacementRecord | null; weeks: number; onStart: () => void }) {
  const known = record ? Object.values(record.results).filter((r) => r === 'known').length : 0
  return (
    <section className="card space-y-4">
      <h1 className="page-title">Hvad kan du allerede?</h1>
      <p>
        En kort test af <b>{course.meta.title}</b>: to-tre spørgsmål pr. uge, fra let til svært. Er svaret tydeligt, går vi videre til næste uge, og testen stopper af sig selv, når du når noget, der er nyt for dig.
      </p>
      <p className="muted text-sm">
        Uger, du klarer, bliver markeret "Kan du allerede", og du starter ved den første uge, der ikke er. Du kan altid vælge at starte fra uge 1 alligevel. Kurset har {weeks} uger; det tager typisk 5–15 minutter.
      </p>
      {record && (
        <p className="rounded-xl p-3 text-sm" style={{ background: 'var(--surface-2)' }}>
          Sidst ({new Date(record.date).toLocaleDateString('da-DK')}): {known ? `du kunne ${known} ${known === 1 ? 'uge' : 'uger'}, og` : ''} du startede i uge {record.start}.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={onStart}>
          {record ? 'Tag testen igen' : 'Start testen'}
        </button>
        <Link className="btn" to={`/kursus/${course.meta.slug}`}>
          Spring over
        </Link>
      </div>
    </section>
  )
}

function Question({
  course,
  state,
  quizById,
  onAnswer,
  onStop,
}: {
  course: CourseData
  state: PlacementState
  quizById: Map<string, Exercise>
  onAnswer: (correct: boolean) => void
  onStop: () => void
}) {
  const [result, setResult] = useState<boolean | null>(null)
  const q = currentQuestion(state)!
  const weekNo = state.weekIndex + 1
  const title = course.weeks[q.week - 1]?.title
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="muted flex justify-between text-sm">
          <span>
            Uge {q.week}: {title}
          </span>
          <span>
            {weekNo} af {state.weeks.length}
          </span>
        </div>
        <Progress value={weekNo - 1} max={state.weeks.length} color={course.meta.color} label="Fremskridt i testen" />
      </div>
      <div className="card">
        <QuickQuestion q={q} quizById={quizById} onAnswered={setResult} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button className="link text-sm" onClick={onStop}>
          Stop her og se resultatet
        </button>
        {result === null ? (
          <button className="btn" onClick={() => onAnswer(false)}>
            Ved ikke
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => onAnswer(result)} autoFocus>
            Næste →
          </button>
        )}
      </div>
    </section>
  )
}

function Result({ course, state, onContinue, onSave }: { course: CourseData; state: PlacementState; onContinue: () => void; onSave: (r: PlacementRecord) => void }) {
  const store = useStore()
  const navigate = useNavigate()
  const results = placementResults(state)
  const start = startWeek(results, state.weeks)
  const known = state.weeks.filter((w) => results[w] === 'known')
  const slug = course.meta.slug
  useEffect(() => {
    onSave({ date: Date.now(), results, start })
    // save once per finished run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])
  const go = (week: number) => {
    store.put('settings', { id: 'position', value: { path: `/kursus/${slug}/uge/${week}`, label: `${course.meta.title} · Uge ${week}: ${course.weeks[week - 1].title}`, course: slug, week, ts: Date.now() } })
    navigate(`/kursus/${slug}/uge/${week}`)
  }
  return (
    <section className="card space-y-4">
      <h1 className="page-title">{known.length ? `Flot — du kan allerede ${known.length} ${known.length === 1 ? 'uge' : 'uger'}` : 'Godt, så ved vi, hvor du skal starte'}</h1>
      <p>
        {start === 1 && !known.length ? 'Kurset er nyt for dig, så du starter fra begyndelsen.' : `Vi foreslår, at du starter i uge ${start}: ${course.weeks[start - 1].title}.`}
        {state.stoppedEarly && ' Testen stoppede, fordi de sidste to uger var nye for dig.'}
      </p>
      <ol className="grid gap-1.5 sm:grid-cols-2">
        {state.weeks.map((w) => (
          <li key={w} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ background: results[w] === 'known' ? 'var(--ok-soft)' : w === start ? 'var(--accent-soft)' : 'var(--surface-2)' }}>
            <span className="w-14 shrink-0 font-medium">Uge {w}</span>
            <span className="min-w-0 flex-1 truncate">{course.weeks[w - 1].title}</span>
            <span className="shrink-0 text-xs font-semibold" style={{ color: results[w] === 'known' ? 'var(--ok)' : w === start ? 'var(--accent)' : 'var(--muted)' }}>
              {results[w] === 'known' ? 'Kan du allerede' : w === start ? 'Start her' : results[w] === 'untested' ? '' : 'Ny for dig'}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => go(start)}>
          Start i uge {start} →
        </button>
        {start !== 1 && (
          <button className="btn" onClick={() => go(1)}>
            Start fra uge 1 alligevel
          </button>
        )}
        {state.stoppedEarly && (
          <button className="btn" onClick={onContinue}>
            Fortsæt testen
          </button>
        )}
      </div>
      <p className="muted text-sm">Dine svar tæller med i din mestring, så Træn kender dit niveau fra start. Du kan tage testen igen fra kursets side.</p>
    </section>
  )
}
