import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { loadCourse, loadWeek } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useCheck, useSetting, useStore, useTable } from '@/lib/store'
import { checkpointId, videoWatched, visitId } from '@/lib/progress'
import { ANSWER_PREF_KEY, ANSWER_PREF_LABEL, filterByAnswerPref, type AnswerPref } from '@/lib/answer-type'
import { splitLesson, type LessonStep } from '@/lib/lesson'
import { questionsForWeek, WEEK_TEST_PASS, WEEK_TEST_SIZE, weekTestKey, type PlacementQuestion, type WeekTestRecord } from '@/lib/placement'
import { weekGenerators, weekPool } from '@/lib/week-pool'
import { randomSeed } from '@/lib/rng'
import { Html } from '@/components/Html'
import { VideoCard } from '@/components/VideoCard'
import { ExerciseCard, fromBank, STARS } from '@/components/ExerciseCard'
import { AnswerPrefPicker } from '@/components/AnswerPrefPicker'
import { QuickQuestion } from '@/components/QuickQuestion'
import { useT } from '@/i18n'
import { courseStyle, Crumbs, ErrorBox, Loading, useTrackPosition } from '@/components/ui'
import type { CourseData, Exercise, LessonQuestion, VideoItem, Week } from '@/types/content'

type Page = { id: string; label: string; kind: 'video' | 'laes' | 'oev' | 'checkpoint'; video?: VideoItem }
const OLD_TABS: Record<string, string> = { noter: 'laes', oevelser: 'oev', oevelse: 'oev' }

/** The week as a row of pages: one per video, then reading, exercises and the checkpoint. */
function weekPages(w: Week, t: ReturnType<typeof useT>): Page[] {
  return [
    ...w.videos.map((v, i): Page => ({ id: `video-${v.id}`, label: t('week.video', { n: i + 1 }), kind: 'video', video: v })),
    { id: 'laes', label: t('week.read'), kind: 'laes' },
    { id: 'oev', label: t('week.exercises'), kind: 'oev' },
    { id: 'checkpoint', label: t('week.checkpoint'), kind: 'checkpoint' },
  ]
}

export default function WeekPage() {
  const { slug = '', week = '1' } = useParams()
  const [params, setParams] = useSearchParams()
  const n = Number(week)
  const { data, error } = useAsync(async () => ({ course: await loadCourse(slug), week: await loadWeek(slug, n) }), [slug, n])
  const store = useStore()
  const t = useT()
  const checks = useTable('checks')
  const fane = params.get('fane') || ''
  const goTo = (id: string) => {
    const p = new URLSearchParams(params)
    p.set('fane', id)
    p.delete('prov')
    setParams(p, { replace: true })
    window.scrollTo(0, 0)
  }
  const [lesson] = useSetting<{ step: number; done: boolean } | null>(`lesson:${slug}/${n}`, null)
  const [test] = useSetting<WeekTestRecord | null>(weekTestKey(slug, n), null)
  useEffect(() => {
    store.put('checks', { id: visitId(slug, n), value: true })
  }, [slug, n, store])
  useTrackPosition(data ? { path: `/kursus/${slug}/uge/${n}`, label: `${data.course.meta.title} · Uge ${n}: ${data.week.title}`, course: slug, week: n } : null)

  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading what="uge" />
  const { course, week: w } = data
  const pages = weekPages(w, t)
  const wanted = fane === 'se' || fane === 'videoer' || !fane ? pages[0].id : OLD_TABS[fane] || fane
  const at = Math.max(0, pages.findIndex((p) => p.id === wanted))
  const page = pages[at]
  const checkMap = new Map((checks || []).map((c) => [c.id, c.value]))
  const checkpointDone = w.checkpoint.length > 0 && w.checkpoint.every((_, i) => checkMap.get(checkpointId(slug, n, i)))
  const isDone = (p: Page) =>
    p.kind === 'video' ? videoWatched(checkMap, slug, p.video!) : p.kind === 'laes' ? !!lesson?.done : p.kind === 'checkpoint' ? checkpointDone || (!!test && test.best >= WEEK_TEST_PASS) : false
  const prevPage = pages[at - 1]
  const nextPage = pages[at + 1]
  const prev = n > 1 ? n - 1 : null
  const next = n < course.weeks.length ? n + 1 : null

  return (
    <div className="course-theme mx-auto max-w-3xl space-y-5" style={courseStyle(course.meta.color)}>
      <Crumbs items={[{ to: '/kurser', label: 'Kurser' }, { to: `/kursus/${slug}`, label: course.meta.title }, { label: `Uge ${n}` }]} />
      <header className="space-y-2">
        <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
          {t('week.of', { n, total: course.weeks.length })}
        </div>
        <h1 className="page-title">{w.title}</h1>
        {(w.goals || w.time || w.prereq) && (
          <details className="text-sm">
            <summary className="link cursor-pointer">{w.time ? t('week.goalsAndTime') : t('week.goals')}</summary>
            <dl className="mt-2 grid gap-2">
              {w.goals && (
                <div>
                  <dt className="inline font-semibold">{t('week.goal')}</dt>
                  <dd className="prose-content inline" dangerouslySetInnerHTML={{ __html: w.goals }} />
                </div>
              )}
              {w.time && (
                <div>
                  <dt className="inline font-semibold">{t('week.time')}</dt>
                  <dd className="prose-content inline" dangerouslySetInnerHTML={{ __html: w.time }} />
                </div>
              )}
              {w.prereq && (
                <div>
                  <dt className="inline font-semibold">{t('week.prereq')}</dt>
                  <dd className="prose-content inline" dangerouslySetInnerHTML={{ __html: w.prereq }} />
                </div>
              )}
            </dl>
          </details>
        )}
      </header>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold">{page.kind === 'video' ? t('week.videoOf', { label: page.label, total: w.videos.length }) : page.label}</span>
          <span className="muted">{t('week.page', { n: at + 1, total: pages.length })}</span>
        </div>
        <div className="progress" role="progressbar" aria-label={t('week.progress')} aria-valuemin={1} aria-valuemax={pages.length} aria-valuenow={at + 1}>
          <div style={{ width: `${((at + 1) / pages.length) * 100}%` }} />
        </div>
        <nav className="page-dots" role="tablist" aria-label={t('week.pages')}>
          {pages.map((p, i) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={i === at}
              aria-label={p.label}
              title={p.label}
              className={`page-dot ${i === at ? 'page-dot-on' : ''} ${isDone(p) ? 'page-dot-done' : ''} ${p.kind === 'video' ? '' : 'page-dot-wide'}`}
              onClick={() => goTo(p.id)}
            >
              {p.kind === 'video' ? (isDone(p) ? '✓' : i + 1) : p.label}
            </button>
          ))}
        </nav>
      </div>

      {page.kind === 'video' && (
        <>
          {at === 0 && w.videosIntro && <Html html={w.videosIntro} className="card reading" />}
          <VideoPage key={page.id} course={slug} item={page.video!} />
        </>
      )}
      {page.kind === 'laes' && <Lesson key={`${slug}/${n}`} course={course} week={w} focus={params.get('prov')} onDone={() => goTo('oev')} />}
      {page.kind === 'oev' && <Practice course={course} week={w} />}
      {page.kind === 'checkpoint' && <CheckpointPage course={course} week={w} />}

      <nav className="flex justify-between gap-2" aria-label={t('week.prevNext')}>
        {prevPage ? (
          <button className="btn" onClick={() => goTo(prevPage.id)}>
            {t('week.prev')}
          </button>
        ) : (
          <span />
        )}
        {nextPage && (
          <button className="btn btn-primary" onClick={() => goTo(nextPage.id)}>
            {t('week.next', { label: nextPage.label })}
          </button>
        )}
      </nav>

      <nav className="flex justify-between gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }} aria-label={t('week.nav')}>
        {prev ? (
          <Link className="btn" to={`/kursus/${slug}/uge/${prev}`}>
            {t('week.prevWeek', { n: prev })}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn" to={`/kursus/${slug}/uge/${next}`}>
            {t('week.nextWeek', { n: next })}
          </Link>
        ) : (
          <Link className="btn" to={course.project ? `/kursus/${slug}/projekt` : `/kursus/${slug}`}>
            {course.project ? t('week.project') : t('week.backToCourse')}
          </Link>
        )}
      </nav>
    </div>
  )
}

// ---------------------------------------------------------------- one video: learn, watch, sum up, check

function VideoPage({ course, item }: { course: string; item: VideoItem }) {
  const t = useT()
  const l = item.lesson
  return (
    <section className="space-y-4" role="tabpanel" aria-label={plainTitle(item.title)}>
      {l?.draft && <p className="muted text-xs">{t('lesson.draft')}</p>}
      {l && l.goals.length > 0 && (
        <div className="card space-y-2">
          <h2 className="section-title">{t('lesson.learn')}</h2>
          <ul className="list-disc space-y-1 pl-5">
            {l.goals.map((g, i) => (
              <li key={i} className="prose-content" dangerouslySetInnerHTML={{ __html: g }} />
            ))}
          </ul>
        </div>
      )}
      <VideoCard course={course} item={item} bare={!!l} />
      {l?.summary && (
        <div className="card space-y-2">
          <h2 className="section-title">{t('lesson.summary')}</h2>
          <Html html={l.summary} className="reading" />
        </div>
      )}
      {l && l.questions.length > 0 && (
        <div className="card space-y-4">
          <h2 className="section-title">{t('lesson.check')}</h2>
          {l.questions.map((q, i) => (
            <LessonQuestionView key={i} q={q} />
          ))}
        </div>
      )}
    </section>
  )
}

const plainTitle = (html: string) => html.replace(/<[^>]+>/g, '').trim()

function LessonQuestionView({ q }: { q: LessonQuestion }) {
  const t = useT()
  const [picked, setPicked] = useState<number | null>(null)
  if (q.options)
    return (
      <div className="space-y-2">
        <div className="prose-content font-medium" dangerouslySetInnerHTML={{ __html: q.prompt }} />
        <div className="flex flex-wrap gap-2">
          {q.options.map((o, i) => (
            <button
              key={i}
              className={`seg ${picked === i ? (i === q.correct ? 'seg-ok' : 'seg-bad') : ''}`}
              aria-pressed={picked === i}
              onClick={() => setPicked(i)}
              dangerouslySetInnerHTML={{ __html: o }}
            />
          ))}
        </div>
        {picked !== null && (
          <p className="text-sm" role="status">
            {picked === q.correct ? t('lesson.right') : t('lesson.wrong')}
          </p>
        )}
      </div>
    )
  return (
    <div className="space-y-1">
      <div className="prose-content font-medium" dangerouslySetInnerHTML={{ __html: q.prompt }} />
      {q.answer ? (
        <details className="text-sm">
          <summary className="link cursor-pointer">{t('lesson.showAnswer')}</summary>
          <div className="prose-content mt-1" dangerouslySetInnerHTML={{ __html: q.answer }} />
        </details>
      ) : (
        <p className="muted text-sm">{t('lesson.think')}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- Læs: bite-sized steps

type LessonItem = { kind: 'text'; step: LessonStep } | { kind: 'question'; q: PlacementQuestion }

function Lesson({ course, week, focus, onDone }: { course: CourseData; week: Week; focus: string | null; onDone: () => void }) {
  const slug = course.meta.slug
  const [saved, setSaved, loaded] = useSetting<{ step: number; done: boolean } | null>(`lesson:${slug}/${week.number}`, null)
  const [all, setAll] = useState(false)
  const quizById = useMemo(() => new Map(week.exercises.filter((e) => e.quiz).map((e) => [e.id, e])), [week])
  const items = useMemo<LessonItem[]>(() => {
    const steps = [...splitLesson(week.notes), ...week.extraSections.map((s) => ({ title: s.title, html: s.html }))]
    // a small question after every third step (learn by doing)
    const questions = questionsForWeek(weekPool(course, week.number, week.exercises), randomSeed(), Math.floor(steps.length / 3))
    const out: LessonItem[] = []
    steps.forEach((s, i) => {
      out.push({ kind: 'text', step: s })
      const q = (i + 1) % 3 === 0 && i < steps.length - 1 ? questions[(i + 1) / 3 - 1] : undefined
      if (q) out.push({ kind: 'question', q })
    })
    return out
  }, [course, week])
  const focusIndex = focus ? items.findIndex((it) => it.kind === 'text' && it.step.html.includes(`data-interactive="${focus}"`)) : -1
  const [i, setI] = useState<number | null>(null)
  const [answered, setAnswered] = useState<Record<number, boolean>>({})
  useEffect(() => {
    if (i === null && loaded) setI(focusIndex >= 0 ? focusIndex : Math.min(saved?.step ?? 0, items.length - 1))
  }, [loaded, i, focusIndex, saved, items.length])
  // jumping to a "Prøv selv" component while already in the lesson
  useEffect(() => {
    if (focusIndex >= 0) setI(focusIndex)
  }, [focusIndex])
  useEffect(() => {
    if (focus && i === focusIndex) setTimeout(() => document.querySelector(`[data-interactive="${focus}"]`)?.scrollIntoView({ block: 'center' }), 300)
  }, [focus, i, focusIndex])
  if (i === null) return <Loading what="noter" />

  const go = (k: number) => {
    setI(k)
    setSaved({ step: k, done: !!saved?.done || k >= items.length - 1 })
    window.scrollTo({ top: 0 })
  }
  const item = items[i]
  const textSteps = items.filter((x) => x.kind === 'text').length

  if (all)
    return (
      <section className="space-y-4" role="tabpanel" aria-label="Læs">
        <div className="flex justify-end">
          <button className="link text-sm" onClick={() => setAll(false)}>
            Vis trin for trin
          </button>
        </div>
        {items.map((it, k) =>
          it.kind === 'text' ? (
            <div key={k} className="card">
              <Html html={it.step.html} className="reading" />
            </div>
          ) : null,
        )}
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={() => (setSaved({ step: items.length - 1, done: true }), onDone())}>
            Videre: Øv →
          </button>
        </div>
      </section>
    )

  return (
    <section className="space-y-4" role="tabpanel" aria-label="Læs">
      <div className="flex items-center gap-3">
        <div className="lesson-dots" aria-hidden>
          {items.map((it, k) => (
            <span key={k} className={`dot ${k < i ? 'dot-done' : ''} ${k === i ? 'dot-on' : ''} ${it.kind === 'question' ? 'dot-q' : ''}`} />
          ))}
        </div>
        <span className="muted shrink-0 text-xs">
          Trin {items.slice(0, i + 1).filter((x) => x.kind === 'text').length} af {textSteps}
        </span>
      </div>
      <div key={i} className="card fade-in space-y-3">
        {item.kind === 'text' ? (
          <>
            <h2 className="section-title">{item.step.title}</h2>
            <Html html={item.step.html} className="reading" />
          </>
        ) : (
          <>
            <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              Hvad tror du?
            </div>
            <QuickQuestion q={item.q} quizById={quizById} onAnswered={(ok) => setAnswered((a) => ({ ...a, [i]: ok }))} />
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        {i > 0 ? (
          <button className="btn" onClick={() => go(i - 1)}>
            ← Tilbage
          </button>
        ) : (
          <button className="link text-sm" onClick={() => setAll(true)}>
            Vis alt på én side
          </button>
        )}
        {i < items.length - 1 ? (
          <button className="btn btn-primary" onClick={() => go(i + 1)}>
            {item.kind === 'question' && answered[i] === undefined ? 'Spring over' : 'Fortsæt'} →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => (setSaved({ step: i, done: true }), onDone())}>
            Færdig — videre til Øv →
          </button>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- Øv: exercises, Øv mere, ugens test, checkpoint

function Practice({ course, week: w }: { course: CourseData; week: Week }) {
  const slug = course.meta.slug
  const n = w.number
  const attempts = useTable('attempts')
  const [pref, setPref] = useSetting<AnswerPref>(ANSWER_PREF_KEY, 'blandet')
  const [filter, setFilter] = useState<'alle' | '1' | '2' | '3' | 'kode' | 'ikke'>('alle')
  const tried = useMemo(() => new Set((attempts || []).filter((a) => a.course === slug && a.week === n).map((a) => a.exerciseId)), [attempts, slug, n])
  const byPref = filterByAnswerPref(w.exercises, (e) => ({ choices: e.hasChoices, typed: true }), pref)
  const exercises = byPref.shown.filter((e) => {
    if (filter === 'alle') return true
    if (filter === 'kode') return e.kind === 'code'
    if (filter === 'ikke') return !tried.has(e.id)
    return String(e.difficulty) === filter
  })
  const topics = course.meta.topics.filter((t) => t.weeks.includes(n))
  const practiceTopics = topics.filter((t) => weekGenerators(course, n).some((g) => g.topics.includes(t.id)))

  return (
    <section className="space-y-4" role="tabpanel" aria-label="Øv">
      {w.exercisesIntro && <Html html={w.exercisesIntro} className="card reading" />}
      <div className="space-y-2">
        <AnswerPrefPicker compact />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="muted">Vis:</span>
          {(
            [
              ['alle', 'Alle'],
              ['1', STARS[1]],
              ['2', STARS[2]],
              ['3', STARS[3]],
              ['kode', 'Kode'],
              ['ikke', 'Ikke prøvet'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} className={filter === k ? 'seg seg-on' : 'seg'} aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
          <span className="muted ml-auto">
            {tried.size} af {w.exercises.length} prøvet
          </span>
        </div>
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

      {practiceTopics.length > 0 && (
        <section className="card space-y-3" aria-labelledby="more-h">
          <h2 id="more-h" className="section-title">
            Øv mere
          </h2>
          <p className="muted text-sm">Bliv ved med nye opgaver i ugens emner — med nye tal hver gang, så længe du har lyst.</p>
          <div className="flex flex-wrap gap-2">
            {practiceTopics.map((t) => (
              <Link key={t.id} className="btn" to={`/traen?kursus=${slug}&emne=${t.id}&start=1`}>
                {t.name} →
              </Link>
            ))}
          </div>
        </section>
      )}

    </section>
  )
}

// ---------------------------------------------------------------- Checkpoint: the week's test and "kan du det her?"

function CheckpointPage({ course, week: w }: { course: CourseData; week: Week }) {
  const slug = course.meta.slug
  const n = w.number
  return (
    <section className="space-y-4" role="tabpanel" aria-label="Checkpoint">
      <WeekTest course={course} week={w} />

      {w.connection && (
        <div className="card">
          <h2 className="section-title mb-2">Sådan hænger det sammen</h2>
          <Html html={w.connection} className="reading" />
        </div>
      )}
      <div className="card space-y-3">
        <h2 className="section-title">Checkpoint: kan du det her?</h2>
        {w.checkpointIntro && <Html html={w.checkpointIntro} />}
        <ul className="space-y-2">
          {w.checkpoint.map((c, i) => (
            <CheckpointItem key={i} id={checkpointId(slug, n, i)} html={c} />
          ))}
        </ul>
      </div>
      <WeekNote course={slug} week={n} />
    </section>
  )
}

function WeekTest({ course, week }: { course: CourseData; week: Week }) {
  const slug = course.meta.slug
  const [record, setRecord] = useSetting<WeekTestRecord | null>(weekTestKey(slug, week.number), null)
  const quizById = useMemo(() => new Map<string, Exercise>(week.exercises.filter((e) => e.quiz).map((e) => [e.id, e])), [week])
  const [run, setRun] = useState<{ qs: PlacementQuestion[]; i: number; right: number; answered: boolean | null } | null>(null)
  const pool = weekPool(course, week.number, week.exercises)
  if (!pool.quizzes.length && !pool.generators.length) return null
  const start = () => setRun({ qs: questionsForWeek(pool, randomSeed(), WEEK_TEST_SIZE), i: 0, right: 0, answered: null })

  if (run && run.i >= run.qs.length) {
    const passed = run.right >= Math.min(WEEK_TEST_PASS, run.qs.length)
    return (
      <section className="card fade-in space-y-3">
        <h2 className="section-title">Ugens test</h2>
        <p className="text-lg font-semibold">
          {run.right} af {run.qs.length} rigtige {passed ? '— bestået ✓' : ''}
        </p>
        <p className="muted text-sm">{passed ? 'Godt gået. Ugen tæller som klaret.' : 'Kig på de øvelser, der drillede, og prøv igen, når du er klar.'}</p>
        <button className="btn" onClick={start}>
          Tag testen igen
        </button>
      </section>
    )
  }
  if (run) {
    const q = run.qs[run.i]
    return (
      <section className="card space-y-3" aria-label="Ugens test">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Ugens test</h2>
          <span className="muted text-sm">
            Spørgsmål {run.i + 1} af {run.qs.length}
          </span>
        </div>
        <QuickQuestion key={run.i} q={q} quizById={quizById} onAnswered={(ok) => setRun({ ...run, answered: ok })} />
        {run.answered !== null && (
          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              autoFocus
              onClick={() => {
                const right = run.right + (run.answered ? 1 : 0)
                const i = run.i + 1
                setRun({ ...run, i, right, answered: null })
                if (i >= run.qs.length && (!record || right > record.best)) setRecord({ best: right, of: run.qs.length, date: Date.now() })
              }}
            >
              {run.i + 1 < run.qs.length ? 'Næste →' : 'Se resultatet'}
            </button>
          </div>
        )}
      </section>
    )
  }
  return (
    <section className="card flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="section-title">Ugens test</h2>
        <p className="muted text-sm">
          {WEEK_TEST_SIZE} korte spørgsmål om ugens stof. {record ? `Bedste: ${record.best} af ${record.of}${record.best >= WEEK_TEST_PASS ? ' ✓' : ''}.` : `Klarer du ${WEEK_TEST_PASS}, er ugen klaret.`}
        </p>
      </div>
      <button className="btn shrink-0" onClick={start}>
        {record ? 'Tag den igen' : 'Tag testen'}
      </button>
    </section>
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
      <h2 className="section-title">Mine noter til ugen</h2>
      <textarea className="input min-h-[6rem]" value={text ?? ''} onChange={(e) => setText(e.target.value)} placeholder="De tre vigtigste idéer med mine egne ord, og det, jeg ikke har forstået endnu …" aria-label="Mine noter til ugen" />
      <p className="muted text-xs">
        Skriv din tid i <Link className="link" to={`/logbog?kursus=${course}&uge=${week}`}>logbogen</Link>.
      </p>
    </div>
  )
}
