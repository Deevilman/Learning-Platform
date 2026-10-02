import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadExercise, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useTable } from '@/lib/store'
import { generators, generatedId } from '@/lib/generators'
import { TrainingSession, startLevel, type TrainItem } from '@/lib/training'
import { findWeakTopics } from '@/lib/weakness'
import { reachedWeeks } from '@/lib/progress'
import { computeMastery } from '@/lib/mastery'
import { miniMarkdown } from '@/lib/mini-md'
import { ExerciseCard, fromBank, STARS, type ExerciseView } from '@/components/ExerciseCard'
import { ErrorBox, Loading } from '@/components/ui'
import type { ContentIndex, Exercise } from '@/types/content'

type Mode = 'blandet' | 'svage' | 'emner' | 'gennemgang'
const MODES: { id: Mode; label: string; help: string }[] = [
  { id: 'blandet', label: 'Blandet repetition', help: 'Alle emner i de uger, du er nået til' },
  { id: 'svage', label: 'Mine svage punkter', help: 'De emner, overblikket anbefaler' },
  { id: 'emner', label: 'Vælg emner', help: 'Du bestemmer selv' },
  { id: 'gennemgang', label: 'Dagens gennemgang', help: 'Kun øvelser, der er klar til repetition' },
]

export default function TrainPage() {
  const [params, setParams] = useSearchParams()
  const { data: index, error } = useAsync(loadIndex, [])
  const attempts = useTable('attempts')
  const checks = useTable('checks')
  const srs = useTable('srs')
  const course = params.get('kursus') || 'alle'
  const mode = (params.get('tilstand') as Mode) || (params.get('emne') ? 'emner' : 'blandet')
  const chosen = useMemo(() => (params.get('emne') || '').split(',').filter(Boolean), [params])
  const [running, setRunning] = useState(params.get('start') === '1' || params.get('tilstand') === 'gennemgang')

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
  let bank = index.exercises.filter((e) => inScope(e.course, e.topics))
  const gens = mode === 'gennemgang' ? [] : generators.filter((g) => inScope(g.course, g.topics))
  if (mode === 'gennemgang') bank = index.exercises.filter((e) => courses.some((c) => c.slug === e.course) && srsMap.get(e.id) && srsMap.get(e.id)!.due <= now)
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
        scopeLabel={scopeLabel(index, scope)}
        onStop={() => setRunning(false)}
      />
    )

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Træn</h1>
        <p className="muted">Uendelig træning: øvelser fra planerne, der er klar til repetition, nye varianter fra opgavegeneratorer og et par øvelser, du ikke har prøvet endnu. Sværhedsgraden følger dig.</p>
      </div>
      <section className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold" htmlFor="course-sel">
            Kursus
          </label>
          <select id="course-sel" className="input" value={course} onChange={(e) => set('kursus', e.target.value === 'alle' ? null : e.target.value)}>
            <option value="alle">Alle kurser</option>
            {index.courses.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Hvad vil du træne?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {MODES.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-start gap-2 rounded-lg border p-3" style={{ borderColor: mode === m.id ? 'var(--accent)' : 'var(--border)' }}>
                <input type="radio" name="mode" checked={mode === m.id} onChange={() => set('tilstand', m.id)} className="mt-1" />
                <span>
                  <span className="block font-medium">{m.label}</span>
                  <span className="muted text-xs">{m.help}</span>
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
                  {c.topics.map((t) => {
                    const on = chosen.includes(t.id)
                    const n = generators.filter((g) => g.course === c.slug && g.topics.includes(t.id)).length
                    return (
                      <button
                        key={t.id}
                        className="btn"
                        aria-pressed={on}
                        style={on ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}
                        onClick={() => set('emne', (on ? chosen.filter((x) => x !== t.id) : [...chosen, t.id]).join(','))}
                      >
                        {t.name}
                        {n > 0 && <span className="opacity-60">· {n}⚙</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--surface-2)' }}>
          <b>Omfang:</b> {scopeLabel(index, scope) || 'ingen emner valgt'}
          <br />
          {bank.length} øvelser fra planerne ({dueCount} klar til repetition) · {gens.length} generatorer {gens.length ? '(uendeligt mange varianter)' : ''}
        </div>
        <button className="btn btn-primary w-full py-2.5 text-base" disabled={!bank.length && !gens.length} onClick={() => setRunning(true)}>
          {mode === 'gennemgang' && !bank.length ? 'Intet at gennemgå i dag 🎉' : 'Start træning'}
        </button>
      </section>
      <p className="muted text-sm">
        ⚙ = antal opgavegeneratorer i emnet. Se alle i <Link className="link" to="/interaktivt">oversigten over interaktive værktøjer og generatorer</Link>.
      </p>
    </div>
  )
}

function avgMastery(attempts: import('@/lib/storage/types').Attempt[], scope: { course: string; topic: string }[], now: number) {
  const vals = scope.map((s) => computeMastery(attempts.filter((a) => a.course === s.course && a.topics.includes(s.topic)), now).mastery)
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function scopeLabel(index: ContentIndex, scope: { course: string; topic: string }[]) {
  const names = scope.map((s) => index.courses.find((c) => c.slug === s.course)?.topics.find((t) => t.id === s.topic)?.name).filter(Boolean)
  return names.length > 6 ? `${names.slice(0, 6).join(', ')} + ${names.length - 6} flere` : names.join(', ')
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
  const session = useRef<TrainingSession>()
  if (!session.current)
    session.current = new TrainingSession({
      bank: props.bank,
      srs: props.srsMap,
      attempted: props.mode === 'gennemgang' ? new Set(props.bank.map((b) => b.id)) : props.attempted,
      generators: props.gens,
      now: Date.now(),
      startDifficulty: props.start,
    })
  const [item, setItem] = useState<TrainItem | null | undefined>(undefined)
  const [bankEx, setBankEx] = useState<Exercise | null>(null)
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState({ n: 0, ok: 0 })
  const [level, setLevel] = useState(session.current.level)

  const advance = () => {
    const next = session.current!.next()
    if (props.mode === 'gennemgang' && next && next.kind === 'bank' && next.reason !== 'due') return setItem(null)
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
      return {
        id: generatedId(item.generatorId, item.seed, item.difficulty),
        course: g.course,
        week: 0,
        topics: g.topics,
        difficulty: item.difficulty,
        kind: 'compute',
        promptHtml: miniMarkdown(item.exercise.prompt),
        hintHtml: item.exercise.hint ? miniMarkdown(item.exercise.hint) : undefined,
        solutionHtml: miniMarkdown(item.exercise.solution),
        check: item.exercise.check,
        source: 'generated',
        generatorId: item.generatorId,
        seed: item.seed,
        title: g.title,
      }
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
        <h1 className="text-xl font-bold">Færdig for nu 🎉</h1>
        <p className="muted">
          Du lavede {stats.n} øvelser, {stats.ok} sad i skabet.
        </p>
        <button className="btn btn-primary" onClick={props.onStop}>
          Tilbage
        </button>
      </div>
    )

  const meta =
    item.kind === 'generated'
      ? { label: `⚙ ${props.gens.find((g) => g.id === item.generatorId)?.title}`, sub: 'Ny variant' }
      : { label: `${bankEx?.course || ''} · ${bankEx?.week ? `uge ${bankEx.week}` : bankEx?.set || ''}`, sub: item.reason === 'due' ? 'Klar til repetition' : item.reason === 'new' ? 'Ny for dig' : 'Repetition' }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button className="btn" onClick={props.onStop}>
          ← Stop
        </button>
        <span className="chip">Øvelse {session.current.count}</span>
        <span className="chip" title="Sværhedsgraden stiger efter 3 rigtige i træk og falder efter 2 fejl i træk">
          Niveau <span style={{ color: 'var(--warn)', marginLeft: 4 }}>{STARS[level]}</span>
        </span>
        <span className="chip">
          {stats.ok}/{stats.n} rigtige
        </span>
        <span className="muted ml-auto truncate text-xs">{props.scopeLabel}</span>
      </div>
      <div className="muted text-xs">
        {meta.label} · {meta.sub}
      </div>
      {view ? <ExerciseCard key={view.id} ex={view} compact={item.kind === 'generated'} onDone={onDone} heading={item.kind === 'bank' && bankEx ? `Øvelse ${bankEx.number}` : 'Opgave'} /> : <Loading what="øvelse" />}
      <div className="flex justify-end gap-2">
        {!done && (
          <button className="btn" onClick={advance}>
            Spring over
          </button>
        )}
        {done && (
          <button className="btn btn-primary" onClick={advance} autoFocus>
            Næste opgave → <span className="opacity-60">(Enter)</span>
          </button>
        )}
      </div>
    </div>
  )
}
