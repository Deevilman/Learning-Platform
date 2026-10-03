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
import { dateLocale, useLang, useT } from '@/i18n'

export default function PlacementPage() {
  const { slug = '' } = useParams()
  const { data, error } = useAsync(async () => {
    const course = await loadCourse(slug)
    const weeks = await Promise.all(course.weeks.map((w) => loadWeek(slug, w.number)))
    return { course, weeks }
  }, [slug])
  const t = useT()
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
      <Crumbs items={[{ to: '/kurser', label: t('nav.courses') }, { to: `/kursus/${slug}`, label: course.meta.title }, { label: t('placement.whatYouKnow') }]} />
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
  const t = useT()
  const [lang] = useLang()
  const known = record ? Object.values(record.results).filter((r) => r === 'known').length : 0
  return (
    <section className="card space-y-4">
      <h1 className="page-title">{t('placement.whatYouKnow')}</h1>
      <p>
        {t('placement.introA')} <b>{course.meta.title}</b>{t('placement.introB')}
      </p>
      <p className="muted text-sm">
        {t('placement.introC', { n: weeks })}
      </p>
      {record && (
        <p className="rounded-xl p-3 text-sm" style={{ background: 'var(--surface-2)' }}>
          {t('placement.lastTime', { date: new Date(record.date).toLocaleDateString(dateLocale(lang)) })} {known ? t(known === 1 ? 'placement.knewOne' : 'placement.knew', { n: known }) : ''} {t('placement.startedIn', { n: record.start })}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={onStart}>
          {record ? t('test.again') : t('placement.start')}
        </button>
        <Link className="btn" to={`/kursus/${course.meta.slug}`}>
          {t('train.skip')}
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
  const t = useT()
  const [result, setResult] = useState<boolean | null>(null)
  const q = currentQuestion(state)!
  const weekNo = state.weekIndex + 1
  const title = course.weeks[q.week - 1]?.title
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <div className="muted flex justify-between text-sm">
          <span>
            {t('placement.weekTitle', { n: q.week, title: title || '' })}
          </span>
          <span>{t('placement.of', { n: weekNo, total: state.weeks.length })}</span>
        </div>
        <Progress value={weekNo - 1} max={state.weeks.length} color={course.meta.color} label={t('placement.progress')} />
      </div>
      <div className="card">
        <QuickQuestion q={q} quizById={quizById} onAnswered={setResult} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button className="link text-sm" onClick={onStop}>
          {t('placement.stop')}
        </button>
        {result === null ? (
          <button className="btn" onClick={() => onAnswer(false)}>
            {t('placement.dontKnow')}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => onAnswer(result)} autoFocus>
            {t('test.next')}
          </button>
        )}
      </div>
    </section>
  )
}

function Result({ course, state, onContinue, onSave }: { course: CourseData; state: PlacementState; onContinue: () => void; onSave: (r: PlacementRecord) => void }) {
  const store = useStore()
  const t = useT()
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
    store.put('settings', { id: 'position', value: { path: `/kursus/${slug}/uge/${week}`, label: `${course.meta.title} · ${t('placement.weekTitle', { n: week, title: course.weeks[week - 1].title })}`, course: slug, week, ts: Date.now() } })
    navigate(`/kursus/${slug}/uge/${week}`)
  }
  return (
    <section className="card space-y-4">
      <h1 className="page-title">{known.length ? t(known.length === 1 ? 'placement.niceOne' : 'placement.nice', { n: known.length }) : t('placement.goodStart')}</h1>
      <p>
        {start === 1 && !known.length ? t('placement.allNew') : t('placement.suggest', { n: start, title: course.weeks[start - 1].title })}
        {state.stoppedEarly && ` ${t('placement.stoppedEarly')}`}
      </p>
      <ol className="grid gap-1.5 sm:grid-cols-2">
        {state.weeks.map((w) => (
          <li key={w} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ background: results[w] === 'known' ? 'var(--ok-soft)' : w === start ? 'var(--accent-soft)' : 'var(--surface-2)' }}>
            <span className="w-14 shrink-0 font-medium">{t('crumb.week', { n: w })}</span>
            <span className="min-w-0 flex-1 truncate">{course.weeks[w - 1].title}</span>
            <span className="shrink-0 text-xs font-semibold" style={{ color: results[w] === 'known' ? 'var(--ok)' : w === start ? 'var(--accent)' : 'var(--muted)' }}>
              {results[w] === 'known' ? t('course.alreadyKnown') : w === start ? t('placement.startHere') : results[w] === 'untested' ? '' : t('train.newTag')}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => go(start)}>
          {t('placement.startIn', { n: start })}
        </button>
        {start !== 1 && (
          <button className="btn" onClick={() => go(1)}>
            {t('placement.fromOne')}
          </button>
        )}
        {state.stoppedEarly && (
          <button className="btn" onClick={onContinue}>
            {t('placement.continue')}
          </button>
        )}
      </div>
      <p className="muted text-sm">{t('placement.note')}</p>
    </section>
  )
}
