import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadExercise, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useSetting, useTable } from '@/lib/store'
import { generators, generatedChoices, type Generator } from '@/lib/generators'
import { ANSWER_PREF_KEY, ANSWER_PREF_LABEL, matchesAnswerPref, type AnswerPref } from '@/lib/answer-type'
import { AnswerPrefPicker } from '@/components/AnswerPrefPicker'
import { DailyGoal } from '@/components/DailyGoal'
import { TrainingSession, startLevel, type TrainItem } from '@/lib/training'
import { findWeakTopics } from '@/lib/weakness'
import { reachedWeeks } from '@/lib/progress'
import { computeMastery } from '@/lib/mastery'
import { ExerciseCard, fromBank, fromGenerated, STARS, type ExerciseView } from '@/components/ExerciseCard'
import { ErrorBox, Loading } from '@/components/ui'
import type { ContentIndex, Exercise } from '@/types/content'
import { useT, type Key, type T } from '@/i18n'

type Mode = 'blandet' | 'svage' | 'emner' | 'gennemgang'
const MODES: { id: Mode; label: Key; help: Key }[] = [
  { id: 'blandet', label: 'train.mixed', help: 'train.mixedHelp' },
  { id: 'svage', label: 'train.weak', help: 'train.weakHelp' },
  { id: 'emner', label: 'train.topics', help: 'train.topicsHelp' },
  { id: 'gennemgang', label: 'train.review', help: 'train.reviewHelp' },
]

export default function TrainPage() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const { data: index, error } = useAsync(loadIndex, [])
  const attempts = useTable('attempts')
  const checks = useTable('checks')
  const srs = useTable('srs')
  const course = params.get('kursus') || 'alle'
  const mode = (params.get('tilstand') as Mode) || (params.get('emne') ? 'emner' : 'blandet')
  const chosen = useMemo(() => (params.get('emne') || '').split(',').filter(Boolean), [params])
  const [running, setRunning] = useState(params.get('start') === '1' || params.get('tilstand') === 'gennemgang')
  const [pref] = useSetting<AnswerPref>(ANSWER_PREF_KEY, 'blandet')

  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params)
    if (v === null || v === '') p.delete(k)
    else p.set(k, v)
    p.delete('start')
    setParams(p, { replace: true })
  }

  if (error) return <ErrorBox error={error} />
  if (!index || !attempts || !checks || !srs) return <Loading what="træning" />

  const courses = course === 'alle' ? index.courses : index.courses.filter((c) => c.slug === course)
  const now = Date.now()
  const reached = reachedWeeks(attempts, checks)

  // Resolve the topic scope for the chosen mode.
  let scope: { course: string; topic: string }[] = []
  if (mode === 'emner') scope = courses.flatMap((c) => c.topics.filter((t) => chosen.includes(t.id)).map((t) => ({ course: c.slug, topic: t.id })))
  else if (mode === 'svage') scope = findWeakTopics(courses, attempts, reached, now, 5).map((w) => ({ course: w.course, topic: w.topic }))
  else if (mode === 'blandet') {
    for (const c of courses) {
      const r = reached.get(c.slug)
      const topics = r && r.size ? c.topics.filter((t) => t.weeks.some((w) => r.has(w))) : c.topics.filter((t) => t.weeks.includes(1))
      scope.push(...topics.map((t) => ({ course: c.slug, topic: t.id })))
    }
  } else scope = courses.flatMap((c) => c.topics.map((t) => ({ course: c.slug, topic: t.id })))

  const inScope = (courseSlug: string, topics: string[]) => scope.some((s) => s.course === courseSlug && topics.includes(s.topic))
  const srsMap = new Map(srs.map((c) => [c.id, c]))
  const fits = (e: { hasChoices: boolean }) => matchesAnswerPref({ choices: e.hasChoices, typed: true }, pref)
  let bank = index.exercises.filter((e) => inScope(e.course, e.topics) && fits(e))
  const srsMapEarly = new Map(srs.map((c) => [c.id, c]))
  const gens =
    mode === 'gennemgang'
      ? // generated skills that are due for repetition come back with new numbers
        generators.filter((g) => courses.some((c) => c.slug === g.course) && (srsMapEarly.get(`gen:${g.id}`)?.due ?? Infinity) <= now && matchesAnswerPref(generatorCaps(g), pref))
      : generators.filter((g) => inScope(g.course, g.topics) && matchesAnswerPref(generatorCaps(g), pref))
  if (mode === 'gennemgang') bank = index.exercises.filter((e) => courses.some((c) => c.slug === e.course) && fits(e) && srsMap.get(e.id) && srsMap.get(e.id)!.due <= now)
  const dueCount = bank.filter((e) => srsMap.get(e.id) && srsMap.get(e.id)!.due <= now).length

  if (running)
    return (
      <Session
        key={`${course}|${mode}|${chosen.join(',')}`}
        index={index}
        mode={mode}
        bank={bank}
        gens={gens}
        srsMap={srsMap}
        attempted={new Set(attempts.map((a) => a.exerciseId))}
        start={startLevel(scope.length ? avgMastery(attempts, scope, now) : undefined)}
        scopeLabel={scopeLabel(index, scope, t)}
        onStop={() => setRunning(false)}
      />
    )

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="page-title">{t('nav.train')}</h1>
        <p className="muted">{t('train.intro')}</p>
      </div>
      <section className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold" htmlFor="course-sel">
            {t('train.course')}
          </label>
          <select id="course-sel" className="input" value={course} onChange={(e) => set('kursus', e.target.value === 'alle' ? null : e.target.value)}>
            <option value="alle">{t('train.allCourses')}</option>
            {index.courses.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold">{t('train.what')}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {MODES.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-start gap-2 rounded-lg border p-3" style={{ borderColor: mode === m.id ? 'var(--accent)' : 'var(--border)' }}>
                <input type="radio" name="mode" checked={mode === m.id} onChange={() => set('tilstand', m.id)} className="mt-1" />
                <span>
                  <span className="block font-medium">{t(m.label)}</span>
                  <span className="muted text-xs">{t(m.help)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {mode === 'emner' && (
          <div className="space-y-3">
            {courses.map((c) => (
              <div key={c.slug}>
                <div className="mb-1 text-sm font-semibold">{c.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {c.topics.map((tp) => {
                    const on = chosen.includes(tp.id)
                    const n = generators.filter((g) => g.course === c.slug && g.topics.includes(tp.id)).length
                    return (
                      <button
                        key={tp.id}
                        className="btn"
                        aria-pressed={on}
                        style={on ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
                        onClick={() => set('emne', (on ? chosen.filter((x) => x !== tp.id) : [...chosen, tp.id]).join(','))}
                      >
                        {tp.name}
                        {n > 0 && <span className="opacity-60" title={t('train.infiniteTitle')}> · ∞</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--surface-2)' }}>
          <b>{t('train.scope')}</b> {scopeLabel(index, scope, t) || t('train.noTopics')}
          <br />
          {mode === 'gennemgang' ? t(bank.length + gens.length === 1 ? 'train.dueOne' : 'train.due', { n: bank.length + gens.length }) : t('train.fromCourse', { n: bank.length, due: dueCount })}
          {mode !== 'gennemgang' && gens.length ? t('train.plusGenerated') : ''}
          {pref !== 'blandet' && <span className="muted"> · {t(ANSWER_PREF_LABEL[pref]).toLowerCase()}</span>}
        </div>
        <AnswerPrefPicker />
        <button className="btn btn-primary w-full py-2.5 text-base" disabled={!bank.length && !gens.length} onClick={() => setRunning(true)}>
          {mode === 'gennemgang' && !bank.length && !gens.length ? t('train.nothingDue') : t('train.start')}
        </button>
      </section>
      <p className="muted text-sm">
        {t('train.infiniteNote')} <Link className="link" to="/interaktivt">{t('nav.tryIt')}</Link>.
      </p>
    </div>
  )
}

const capsCache = new Map<string, { choices: boolean; typed: boolean }>()
/** What answer formats a generator offers (judged from a sample). */
function generatorCaps(g: Generator) {
  let c = capsCache.get(g.id)
  if (!c) {
    const ex = g.generate(1, g.difficulties[0])
    c = { choices: !!generatedChoices(ex, 1), typed: ex.check.type !== 'choice' }
    capsCache.set(g.id, c)
  }
  return c
}

function avgMastery(attempts: import('@/lib/storage/types').Attempt[], scope: { course: string; topic: string }[], now: number) {
  const vals = scope.map((s) => computeMastery(attempts.filter((a) => a.course === s.course && a.topics.includes(s.topic)), now).mastery)
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function scopeLabel(index: ContentIndex, scope: { course: string; topic: string }[], t: T) {
  const names = scope.map((s) => index.courses.find((c) => c.slug === s.course)?.topics.find((tp) => tp.id === s.topic)?.name).filter(Boolean)
  return names.length > 6 ? t('train.andMore', { list: names.slice(0, 6).join(', '), n: names.length - 6 }) : names.join(', ')
}

function Session(props: {
  index: ContentIndex
  mode: Mode
  bank: ContentIndex['exercises']
  gens: typeof generators
  srsMap: Map<string, import('@/lib/storage/types').SrsRec>
  attempted: Set<string>
  start: 1 | 2 | 3
  scopeLabel: string
  onStop: () => void
}) {
  const t = useT()
  const session = useRef<TrainingSession>()
  if (!session.current)
    session.current = new TrainingSession({
      bank: props.bank,
      srs: props.srsMap,
      attempted: props.mode === 'gennemgang' ? new Set(props.bank.map((b) => b.id)) : props.attempted,
      generators: props.gens,
      now: Date.now(),
      startDifficulty: props.start,
      reviewOnly: props.mode === 'gennemgang',
    })
  const [item, setItem] = useState<TrainItem | null | undefined>(undefined)
  const [bankEx, setBankEx] = useState<Exercise | null>(null)
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState({ n: 0, ok: 0 })
  const [level, setLevel] = useState(session.current.level)

  const advance = () => {
    const next = session.current!.next()
    setItem(next)
    setDone(false)
    setBankEx(null)
    window.scrollTo({ top: 0 })
  }
  useEffect(advance, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (item?.kind === 'bank') loadExercise(item.exerciseId).then((e) => setBankEx(e || null))
  }, [item])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done && e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) advance()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const view: ExerciseView | null = useMemo(() => {
    if (!item) return null
    if (item.kind === 'generated') {
      const g = props.gens.find((x) => x.id === item.generatorId)!
      return fromGenerated(g, item.seed, item.difficulty, item.exercise)
    }
    return bankEx ? fromBank(bankEx) : null
  }, [item, bankEx, props.gens])

  const onDone = (score: number) => {
    session.current!.record(score)
    setLevel(session.current!.level)
    setStats((s) => ({ n: s.n + 1, ok: s.ok + (score >= 0.66 ? 1 : 0) }))
    setDone(true)
  }

  if (item === undefined) return <Loading what="træning" />
  if (item === null)
    return (
      <div className="card mx-auto max-w-xl space-y-3 text-center">
        <h1 className="text-xl font-bold">{t('train.finished')}</h1>
        <p className="muted">{t('train.summary', { n: stats.n, ok: stats.ok })}</p>
        <button className="btn btn-primary" onClick={props.onStop}>
          {t('train.back')}
        </button>
      </div>
    )

  const meta =
    item.kind === 'generated'
      ? { label: `${props.gens.find((g) => g.id === item.generatorId)?.title}`, sub: t('train.newNumbers') }
      : { label: `${props.index.courses.find((c) => c.slug === bankEx?.course)?.title || ''} · ${bankEx?.week ? t('missing.week', { n: bankEx.week }) : bankEx?.set === 'selftest' ? t('train.selftest') : bankEx?.set === 'interview' ? t('train.interview') : ''}`, sub: item.reason === 'due' ? t('train.dueTag') : item.reason === 'new' ? t('train.newTag') : t('train.reviewTag') }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button className="btn" onClick={props.onStop}>
          {t('train.stop')}
        </button>
        <span className="chip">{t('exercise.title', { n: session.current.count })}</span>
        <span className="chip" title={t('train.levelTitle')}>
          {t('train.level')} <span style={{ color: 'var(--warn)', marginLeft: 4 }}>{STARS[level]}</span>
        </span>
        <span className="chip">{t('train.right', { ok: stats.ok, n: stats.n })}</span>
        <span className="muted ml-auto truncate text-xs">{props.scopeLabel}</span>
      </div>
      <DailyGoal compact />
      <div className="muted text-xs">
        {meta.label} · {meta.sub}
      </div>
      {view ? <ExerciseCard key={view.id} ex={view} compact={item.kind === 'generated'} onDone={onDone} heading={item.kind === 'bank' && bankEx ? t('exercise.title', { n: bankEx.number }) : t('exercise.generic')} /> : <Loading what="øvelse" />}
      <div className="flex justify-end gap-2">
        {!done && (
          <button className="btn" onClick={advance}>
            {t('train.skip')}
          </button>
        )}
        {done && (
          <button className="btn btn-primary" onClick={advance} autoFocus>
            {t('train.next')} <span className="opacity-60">(Enter)</span>
          </button>
        )}
      </div>
    </div>
  )
}
