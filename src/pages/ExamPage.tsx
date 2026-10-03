// "Prøveeksamen" for courses with exam: htx (two timed parts, answers at the
// end, a grade estimate) or exam: olympiade (proof problems, scored by the
// learner against the solution).

import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { loadCourse, loadWeek } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { weekPool } from '@/lib/week-pool'
import { buildExam, EXAM_LENGTHS, gradeEstimate, topicsToTrain, type ExamLength, type ExamPart } from '@/lib/exam'
import { randomSeed } from '@/lib/rng'
import { QuickQuestion, questionView } from '@/components/QuickQuestion'
import { Html } from '@/components/Html'
import { courseStyle, Crumbs, ErrorBox, Loading } from '@/components/ui'
import { useT } from '@/i18n'
import type { CourseData, Exercise, Week } from '@/types/content'

type Answer = { correct: boolean; answer: string }

export default function ExamPage() {
  const t = useT()
  const { slug = '' } = useParams()
  const { data, error } = useAsync(async () => {
    const course = await loadCourse(slug)
    const weeks = await Promise.all(course.weeks.map((w) => loadWeek(slug, w.number)))
    return { course, weeks }
  }, [slug])
  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading />
  const { course, weeks } = data
  return (
    <div className="course-theme mx-auto max-w-3xl space-y-5" style={courseStyle(course.meta.color)}>
      <Crumbs items={[{ to: '/kurser', label: t('nav.courses') }, { to: `/kursus/${slug}`, label: course.meta.title }, { label: t('exam.title') }]} />
      {course.meta.exam === 'olympiade' ? <Olympiad course={course} weeks={weeks} /> : <Htx course={course} weeks={weeks} />}
    </div>
  )
}

// ---------------------------------------------------------------- HTX

function Htx({ course, weeks }: { course: CourseData; weeks: Week[] }) {
  const t = useT()
  const quizById = useMemo(() => new Map(weeks.flatMap((w) => w.exercises.filter((e) => e.quiz).map((e) => [e.id, e] as const))), [weeks])
  const pools = useMemo(() => course.weeks.map((w) => weekPool(course, w.number, weeks[w.number - 1].exercises)), [course, weeks])
  const [exam, setExam] = useState<{ parts: ExamPart[]; part: number; endsAt: number; answers: Map<string, Answer> } | null>(null)
  const [done, setDone] = useState(false)

  const start = (len: ExamLength) => {
    const parts = buildExam(pools, randomSeed(), len)
    setDone(false)
    setExam({ parts, part: 0, endsAt: Date.now() + parts[0].minutes * 60_000, answers: new Map() })
  }
  const nextPart = () => {
    if (!exam) return
    if (exam.part + 1 >= exam.parts.length) return setDone(true)
    const part = exam.part + 1
    setExam({ ...exam, part, endsAt: Date.now() + exam.parts[part].minutes * 60_000 })
  }

  if (!exam)
    return (
      <section className="card space-y-4">
        <h1 className="page-title">{t('exam.htxTitle')}</h1>
        <p>{t('exam.htxIntro')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {EXAM_LENGTHS.map((len) => (
            <button key={len.id} className="card-flat space-y-1 text-left hover:shadow-md" style={{ background: 'var(--surface-2)' }} onClick={() => start(len)}>
              <div className="font-semibold">{t(len.id === 'kort' ? 'exam.short' : 'exam.full')}</div>
              <div className="muted text-sm">{t('exam.lengthInfo', { a: len.minutes[0], b: len.minutes[1], n: len.questions[0] + len.questions[1] })}</div>
            </button>
          ))}
        </div>
        <p className="muted text-xs">{t('exam.estimateNote')}</p>
      </section>
    )

  if (done) {
    const all = exam.parts.flatMap((p, pi) => p.questions.map((q, qi) => ({ q, key: `${pi}/${qi}`, part: pi })))
    const results = all.map(({ q, key, part }) => {
      const v = questionView(q, quizById)
      const topics = v.kind === 'quiz' ? v.exercise.topics : v.ex.topics
      const a = exam.answers.get(key)
      return { q, key, part, v, topics, a, points: a?.correct ? 1 : 0, max: 1 }
    })
    const points = results.reduce((s, r) => s + r.points, 0)
    const grade = gradeEstimate(points / Math.max(1, results.length))
    const train = topicsToTrain(results).slice(0, 5)
    const topicName = (id: string) => course.meta.topics.find((x) => x.id === id)?.name || id
    return (
      <section className="space-y-4">
        <div className="card space-y-2">
          <h1 className="page-title">{t('exam.result')}</h1>
          <p className="text-lg font-semibold">{t('exam.points', { n: points, total: results.length })}</p>
          <p>
            {t('exam.grade')} <b className="text-xl">{grade}</b>
          </p>
          <p className="muted text-xs">{t('exam.estimateNote')}</p>
          {train.length > 0 && (
            <div className="space-y-1 pt-2">
              <div className="font-semibold">{t('exam.train')}</div>
              <div className="flex flex-wrap gap-2">
                {train.map((tp) => (
                  <Link key={tp} className="btn" to={`/traen?kursus=${course.meta.slug}&emne=${tp}&start=1`}>
                    {topicName(tp)} →
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <ol className="space-y-3">
          {results.map((r, i) => (
            <li key={r.key} className="card space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <b>{t('exam.question', { n: i + 1 })}</b>
                <span className="chip">{t(r.part === 0 ? 'exam.part1' : 'exam.part2')}</span>
                <span className="chip" style={r.a?.correct ? { background: 'var(--ok-soft)', color: 'var(--ok)' } : { background: 'var(--bad-soft)', color: 'var(--bad)' }}>
                  {r.a ? (r.a.correct ? t('exam.right') : t('exam.wrong')) : t('exam.unanswered')}
                </span>
              </div>
              <Html html={r.v.kind === 'quiz' ? r.v.exercise.quiz!.question : r.v.ex.promptHtml} className="reading" />
              {r.a && <p className="text-sm">{t('exam.yourAnswer', { answer: r.a.answer })}</p>}
              <details className="text-sm">
                <summary className="link cursor-pointer">{t('exercise.showSolution')}</summary>
                <Html html={r.v.kind === 'quiz' ? r.v.exercise.quiz!.explain || r.v.exercise.solution || '' : r.v.ex.solutionHtml} className="mt-2" />
              </details>
            </li>
          ))}
        </ol>
        <button className="btn" onClick={() => setExam(null)}>
          {t('exam.again')}
        </button>
      </section>
    )
  }

  const part = exam.parts[exam.part]
  return (
    <section className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3" style={{ position: 'sticky', top: 64, zIndex: 10 }}>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{t(exam.part === 0 ? 'exam.part1' : 'exam.part2')}</div>
          <div className="muted text-xs">{t('exam.answered', { n: part.questions.filter((_, i) => exam.answers.has(`${exam.part}/${i}`)).length, total: part.questions.length })}</div>
        </div>
        <Timer endsAt={exam.endsAt} onEnd={nextPart} />
        <button className="btn btn-primary" onClick={nextPart}>
          {exam.part + 1 < exam.parts.length ? t('exam.toPart2') : t('exam.finish')}
        </button>
      </div>
      <ol className="space-y-3">
        {part.questions.map((q, i) => (
          <li key={`${exam.part}/${i}`} className="card space-y-2">
            <b className="text-sm">{t('exam.question', { n: i + 1 })}</b>
            <QuickQuestion q={q} quizById={quizById} silent onAnswered={(correct, answer) => setExam((e) => e && { ...e, answers: new Map(e.answers).set(`${e.part}/${i}`, { correct, answer }) })} />
          </li>
        ))}
      </ol>
    </section>
  )
}

function Timer({ endsAt, onEnd }: { endsAt: number; onEnd: () => void }) {
  const t = useT()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const left = Math.max(0, endsAt - now)
  useEffect(() => {
    if (left === 0) onEnd()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left === 0])
  const m = Math.floor(left / 60_000)
  const s = Math.floor((left % 60_000) / 1000)
  return (
    <span className="font-mono text-lg" role="timer" aria-label={t('exam.timeLeft')} style={{ color: left < 5 * 60_000 ? 'var(--bad)' : undefined }}>
      {m}:{String(s).padStart(2, '0')}
    </span>
  )
}

// ---------------------------------------------------------------- Olympiad

function Olympiad({ weeks }: { course: CourseData; weeks: Week[] }) {
  const t = useT()
  const proofs = useMemo(() => weeks.flatMap((w) => w.exercises.filter((e) => e.kind === 'proof')), [weeks])
  const [run, setRun] = useState<{ problems: Exercise[]; endsAt: number; texts: string[]; done: boolean; scores: (number | null)[] } | null>(null)
  const start = (n: number, minutes: number) => {
    const shuffled = [...proofs].sort(() => Math.random() - 0.5).slice(0, n)
    setRun({ problems: shuffled, endsAt: Date.now() + minutes * 60_000, texts: shuffled.map(() => ''), done: false, scores: shuffled.map(() => null) })
  }
  if (!proofs.length) return <p className="card muted">{t('exam.noProofs')}</p>
  if (!run)
    return (
      <section className="card space-y-4">
        <h1 className="page-title">{t('exam.olympiadTitle')}</h1>
        <p>{t('exam.olympiadIntro')}</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => start(Math.min(3, proofs.length), 90)}>
            {t('exam.olyShort')}
          </button>
          <button className="btn" onClick={() => start(Math.min(6, proofs.length), 270)}>
            {t('exam.olyFull')}
          </button>
        </div>
      </section>
    )
  const total = run.scores.reduce<number>((s, x) => s + (x ?? 0), 0)
  return (
    <section className="space-y-4">
      {!run.done ? (
        <div className="card flex items-center gap-3" style={{ position: 'sticky', top: 64, zIndex: 10 }}>
          <div className="min-w-0 flex-1 font-semibold">{t('exam.olympiadTitle')}</div>
          <Timer endsAt={run.endsAt} onEnd={() => setRun({ ...run, done: true })} />
          <button className="btn btn-primary" onClick={() => setRun({ ...run, done: true })}>
            {t('exam.finish')}
          </button>
        </div>
      ) : (
        <div className="card space-y-1">
          <h1 className="page-title">{t('exam.result')}</h1>
          <p className="text-lg font-semibold">{t('exam.points', { n: total, total: run.problems.length * 7 })}</p>
          <p className="muted text-sm">{t('exam.selfScore')}</p>
        </div>
      )}
      <ol className="space-y-3">
        {run.problems.map((e, i) => (
          <li key={e.id} className="card space-y-2">
            <b className="text-sm">{t('exam.question', { n: i + 1 })}</b>
            <Html html={e.prompt} className="reading" />
            <textarea className="input min-h-[8rem]" value={run.texts[i]} readOnly={run.done} aria-label={t('exam.proof')} onChange={(ev) => setRun({ ...run, texts: run.texts.map((x, j) => (j === i ? ev.target.value : x)) })} />
            {run.done && (
              <>
                <details className="text-sm" open>
                  <summary className="link cursor-pointer">{t('exercise.solution')}</summary>
                  <Html html={e.solution || ''} className="mt-2" />
                </details>
                <div className="flex flex-wrap items-center gap-1 text-sm" role="radiogroup" aria-label={t('exam.points7')}>
                  <span className="muted mr-1">{t('exam.points7')}</span>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((p) => (
                    <button key={p} role="radio" aria-checked={run.scores[i] === p} className={run.scores[i] === p ? 'seg seg-on' : 'seg'} onClick={() => setRun({ ...run, scores: run.scores.map((x, j) => (j === i ? p : x)) })}>
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
