// One exercise: prompt, saved answer, hint → solution, self-rating or
// auto-check, personal notes and attempt history.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { AutoCheck, Difficulty, Exercise } from '@/types/content'
import { Html } from './Html'
import { CodeRunPanel } from './CodeRunPanel'
import { useRecord, useStore, useTable, recordAttempt } from '@/lib/store'
import { evaluate, type CheckResult } from '@/lib/check'
import { RATING_LABEL, RATING_SCORE } from '@/lib/srs'
import type { Rating } from '@/lib/storage/types'
import { hasRunner } from '@/lib/runners'

export const STARS: Record<Difficulty, string> = { 1: '★', 2: '★★', 3: '★★★' }
export const KIND_LABEL: Record<string, string> = {
  compute: 'Beregning',
  proof: 'Bevis',
  code: '💻 Kode',
  explain: '🗣️ Forklar',
  interview: 'Interview',
  selftest: 'Selvtest',
  project: 'Projekt',
}

export interface ExerciseView {
  id: string // storage id (bank id or generated id)
  course: string
  week: number
  number?: string
  topics: string[]
  difficulty: Difficulty
  kind: string
  promptHtml: string
  hintHtml?: string
  solutionHtml: string
  check?: AutoCheck
  source: 'bank' | 'generated'
  generatorId?: string
  seed?: number
  title?: string
}

export function fromBank(e: Exercise): ExerciseView {
  return {
    id: e.id,
    course: e.course,
    week: e.week,
    number: e.number,
    topics: e.topics,
    difficulty: e.difficulty,
    kind: e.kind,
    promptHtml: e.prompt,
    hintHtml: e.hint,
    solutionHtml: e.solution,
    check: e.check,
    source: 'bank',
  }
}

const RATING_STYLE: Record<Rating, React.CSSProperties> = {
  0: { borderColor: 'var(--bad)', color: 'var(--bad)' },
  1: { borderColor: 'var(--warn)', color: 'var(--warn)' },
  2: { borderColor: 'var(--accent)', color: 'var(--accent)' },
  3: { borderColor: 'var(--ok)', color: 'var(--ok)' },
}

function useDebouncedSave(table: 'answers' | 'notes', id: string) {
  const store = useStore()
  const [rec, loaded] = useRecord(table, id)
  const [text, setText] = useState('')
  const dirty = useRef(false)
  useEffect(() => {
    if (loaded && !dirty.current) setText(rec?.text || '')
  }, [rec, loaded])
  useEffect(() => {
    dirty.current = false
  }, [id])
  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(() => {
      store.put(table, { id, text })
      dirty.current = false
    }, 400)
    return () => clearTimeout(t)
  }, [text, id, table, store])
  return [text, (v: string) => ((dirty.current = true), setText(v))] as const
}

export function ExerciseCard({
  ex,
  heading,
  compact = false,
  onDone,
}: {
  ex: ExerciseView
  heading?: React.ReactNode
  compact?: boolean
  onDone?: (score: number) => void
}) {
  const store = useStore()
  const [answer, setAnswer] = useDebouncedSave('answers', ex.id)
  const [note, setNote] = useDebouncedSave('notes', ex.id)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [rated, setRated] = useState<Rating | null>(null)
  const [runKey, setRunKey] = useState(0)
  const [showNotes, setShowNotes] = useState(false)
  const allAttempts = useTable('attempts')
  const history = useMemo(() => (allAttempts || []).filter((a) => a.exerciseId === ex.id).sort((a, b) => b.ts - a.ts), [allAttempts, ex.id])

  useEffect(() => {
    setShowHint(false)
    setShowSolution(false)
    setResult(null)
    setRated(null)
    setRunKey(0)
  }, [ex.id])

  const base = { exerciseId: ex.id, course: ex.course, week: ex.week, topics: ex.topics, difficulty: ex.difficulty, source: ex.source, generatorId: ex.generatorId, seed: ex.seed }

  async function submitCheck(value: string) {
    if (!ex.check) return
    const r = evaluate(ex.check, value)
    setResult(r)
    setShowSolution(true)
    const score = r.correct ? 1 : 0
    await recordAttempt(store, { ...base, score, auto: true, answer: value.slice(0, 2000) }, r.correct ? (showHint ? 2 : 3) : 0)
    onDone?.(score)
  }

  async function rate(r: Rating) {
    setRated(r)
    // Seeing the hint caps the rating at "Kunne med hint".
    const effective = (showHint && r === 3 ? 2 : r) as Rating
    await recordAttempt(store, { ...base, score: RATING_SCORE[effective], rating: effective, answer: answer.slice(0, 4000) }, effective)
    onDone?.(RATING_SCORE[effective])
  }

  const isCode = ex.kind === 'code'
  const canRun = isCode && hasRunner('python')

  return (
    <article className="card space-y-4" aria-labelledby={`ex-h-${ex.id}`}>
      <header className="flex flex-wrap items-center gap-2">
        <h3 id={`ex-h-${ex.id}`} className="text-base font-bold">
          {heading ?? (ex.number ? `Øvelse ${ex.number}` : 'Øvelse')}
        </h3>
        <span className="chip" title={`Sværhedsgrad ${ex.difficulty}`} style={{ color: 'var(--warn)' }}>
          {STARS[ex.difficulty]}
        </span>
        <span className="chip">{KIND_LABEL[ex.kind] || ex.kind}</span>
        {ex.check && <span className="chip" style={{ color: 'var(--ok)' }}>Auto-tjek</span>}
        {history.length > 0 && (
          <span className="chip ml-auto" title="Seneste vurdering">
            {history.length} forsøg · senest {history[0].rating !== undefined ? RATING_LABEL[history[0].rating] : history[0].score >= 1 ? 'rigtigt' : 'forkert'}
          </span>
        )}
      </header>

      <Html html={ex.promptHtml} />

      {/* ---------- answer area */}
      {ex.check ? (
        <CheckInput check={ex.check} disabled={!!result} onSubmit={submitCheck} result={result} />
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor={`ans-${ex.id}`}>
            {isCode ? 'Din kode' : 'Dit svar'} <span className="muted font-normal">(gemmes automatisk)</span>
          </label>
          <textarea
            id={`ans-${ex.id}`}
            className="input min-h-[7rem]"
            style={isCode ? { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.85rem' } : undefined}
            spellCheck={!isCode}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (isCode && e.key === 'Tab') {
                e.preventDefault()
                const t = e.currentTarget
                const s = t.selectionStart
                setAnswer(answer.slice(0, s) + '    ' + answer.slice(t.selectionEnd))
                requestAnimationFrame(() => (t.selectionStart = t.selectionEnd = s + 4))
              }
            }}
            placeholder={isCode ? '# Skriv Python her (kun standardbiblioteket)…' : 'Skriv dit svar, din udregning eller dit bevis her…'}
          />
          {canRun && (
            <div>
              <button className="btn" onClick={() => setRunKey((k) => k + 1)} disabled={!answer.trim()}>
                ▶ Kør min kode
              </button>
              {runKey > 0 && <CodeRunPanel key={runKey} lang="python" code={answer} />}
            </div>
          )}
        </div>
      )}

      {/* ---------- hint / solution */}
      <div className="flex flex-wrap gap-2">
        {ex.hintHtml && !showHint && (
          <button className="btn" onClick={() => setShowHint(true)}>
            💡 Vis hint
          </button>
        )}
        {!showSolution && (
          <button className={ex.check ? 'btn' : 'btn btn-primary'} onClick={() => setShowSolution(true)}>
            {ex.check ? 'Giv op — vis løsning' : 'Vis løsning'}
          </button>
        )}
      </div>
      {showHint && ex.hintHtml && (
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--warn)', background: 'var(--warn-soft)' }}>
          <div className="mb-1 text-sm font-semibold">Hint</div>
          <Html html={ex.hintHtml} />
        </div>
      )}
      {showSolution && (
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          <div className="mb-1 text-sm font-semibold">Løsning</div>
          <Html html={ex.solutionHtml} />
        </div>
      )}

      {/* ---------- self rating */}
      {showSolution && !ex.check && (
        <div>
          <div className="mb-2 text-sm font-medium">Hvordan gik det?</div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Vurdér dig selv">
            {([0, 1, 2, 3] as Rating[]).map((r) => (
              <button
                key={r}
                className="btn"
                style={rated === r ? { ...RATING_STYLE[r], background: 'var(--surface-2)', borderWidth: 2 } : RATING_STYLE[r]}
                onClick={() => rate(r)}
                disabled={rated !== null}
                aria-pressed={rated === r}
              >
                {RATING_LABEL[r]}
              </button>
            ))}
          </div>
          {rated !== null && <p className="muted mt-2 text-sm">Gemt. {showHint && rated === 3 ? '(Talt som "Kunne med hint", fordi du så hintet.)' : ''}</p>}
        </div>
      )}
      {ex.check && showSolution && !result && (
        <p className="muted text-sm">Du gav op — prøv en ny variant, eller kom tilbage til den senere.</p>
      )}

      {/* ---------- notes + history */}
      {!compact && (
        <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          <button className="text-sm font-medium link" onClick={() => setShowNotes((s) => !s)} aria-expanded={showNotes}>
            {showNotes ? '▾' : '▸'} Mine noter og historik {note ? '•' : ''}
          </button>
          {showNotes && (
            <div className="mt-2 space-y-3">
              <textarea className="input min-h-[4rem]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Noter til dig selv (fx hvor du gik i stå)…" aria-label="Mine noter" />
              {history.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {history.slice(0, 10).map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <span className="muted">{new Date(a.ts).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span>{a.rating !== undefined ? RATING_LABEL[a.rating] : a.score >= 1 ? '✓ rigtigt' : '✗ forkert'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted text-sm">Ingen forsøg endnu.</p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function CheckInput({ check, disabled, onSubmit, result }: { check: AutoCheck; disabled: boolean; onSubmit: (v: string) => void; result: CheckResult | null }) {
  const [value, setValue] = useState('')
  useEffect(() => setValue(''), [check])
  const feedback = result && (
    <div role="status" className="rounded-lg px-3 py-2 text-sm font-medium" style={{ background: result.correct ? 'var(--ok-soft)' : 'var(--bad-soft)', color: result.correct ? 'var(--ok)' : 'var(--bad)' }}>
      {result.correct ? '✓ ' : '✗ '}
      {result.message}
    </div>
  )
  if (check.type === 'choice')
    return (
      <div className="space-y-2">
        <fieldset className="space-y-1.5" disabled={disabled}>
          <legend className="sr-only">Vælg et svar</legend>
          {check.options.map((o, i) => (
            <label key={i} className="flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: value === String(i) ? 'var(--accent)' : 'var(--border)' }}>
              <input type="radio" name="choice" value={i} checked={value === String(i)} onChange={() => setValue(String(i))} className="mt-0.5" />
              <span>{o}</span>
            </label>
          ))}
        </fieldset>
        {!disabled && (
          <button className="btn btn-primary" disabled={value === ''} onClick={() => onSubmit(value)}>
            Tjek svar
          </button>
        )}
        {feedback}
      </div>
    )
  const multiline = check.type === 'output'
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim()) onSubmit(value)
      }}
    >
      <label className="block text-sm font-medium">
        Dit svar{' '}
        <span className="muted font-normal">
          {check.type === 'numeric' ? `(tal — fx 0,25, 1/4 eller 25 %${check.unit ? `; enhed: ${check.unit}` : ''})` : check.type === 'numeric-list' ? `(${check.answers.length} tal adskilt af semikolon)` : ''}
        </span>
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        {multiline ? (
          <textarea className="input min-h-[5rem] font-mono" value={value} onChange={(e) => setValue(e.target.value)} disabled={disabled} />
        ) : (
          <input className="input" inputMode={check.type === 'numeric' ? 'decimal' : undefined} value={value} onChange={(e) => setValue(e.target.value)} disabled={disabled} autoComplete="off" />
        )}
        {!disabled && (
          <button type="submit" className="btn btn-primary shrink-0" disabled={!value.trim()}>
            Tjek svar
          </button>
        )}
      </div>
      {feedback}
    </form>
  )
}
