// One exercise: prompt, hints one step at a time, answer (typed, multiple
// choice or free text you rate yourself), solution, notes and history.

import { dateLocale, useLang, useT, type Key } from '@/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AutoCheck, Difficulty, Exercise, Quiz } from '@/types/content'
import { Html } from './Html'
import { CodeRunPanel } from './CodeRunPanel'
import { useRecord, useSetting, useStore, useTable, recordAttempt } from '@/lib/store'
import { evaluate, type CheckResult } from '@/lib/check'
import { RATING_LABEL, RATING_SCORE } from '@/lib/srs'
import type { Rating } from '@/lib/storage/types'
import { hasRunner } from '@/lib/runners'
import { miniMarkdown } from '@/lib/mini-md'
import { generatedChoices, generatedId, type GeneratedExercise, type Generator } from '@/lib/generators'
import { choiceCheck, type Choices } from '@/lib/choices'
import { ANSWER_PREF_KEY, answerFormat, type AnswerPref } from '@/lib/answer-type'

export const STARS: Record<Difficulty, string> = { 1: '★', 2: '★★', 3: '★★★' }
export const KIND_LABEL: Record<string, Key> = {
  compute: 'kind.compute',
  proof: 'kind.proof',
  code: 'kind.code',
  explain: 'kind.explain',
  interview: 'kind.interview',
  selftest: 'kind.selftest',
  project: 'kind.project',
}

/** Score for a correct auto-checked answer: each hint used costs a little. */
export const scoreWithHints = (hints: number) => Math.max(0.6, 1 - 0.15 * hints)

export interface ExerciseView {
  id: string // storage id (bank id or generated id)
  course: string
  week: number
  number?: string
  topics: string[]
  difficulty: Difficulty
  kind: string
  promptHtml: string
  hintsHtml: string[]
  solutionHtml: string
  check?: AutoCheck
  choices?: Choices
  quiz?: Quiz
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
    hintsHtml: e.hints,
    solutionHtml: e.solution,
    check: e.check,
    choices: e.check?.type === 'choice' ? { options: e.check.options, correct: e.check.correct } : undefined,
    quiz: e.quiz,
    source: 'bank',
  }
}

export function fromGenerated(g: Generator, seed: number, difficulty: Difficulty, ex: GeneratedExercise = g.generate(seed, difficulty)): ExerciseView {
  return {
    id: generatedId(g.id, seed, difficulty),
    course: g.course,
    week: 0,
    topics: g.topics,
    difficulty,
    kind: 'compute',
    promptHtml: miniMarkdown(ex.prompt),
    hintsHtml: [ex.hint, ...(ex.moreHints || [])].map(miniMarkdown),
    solutionHtml: miniMarkdown(ex.solution),
    check: ex.check,
    choices: generatedChoices(ex, seed) || undefined,
    source: 'generated',
    generatorId: g.id,
    seed,
    title: g.title,
  }
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
  const t = useT()
  const [lang] = useLang()
  const [pref] = useSetting<AnswerPref>(ANSWER_PREF_KEY, 'blandet')
  const [answer, setAnswer] = useDebouncedSave('answers', ex.id)
  const [note, setNote] = useDebouncedSave('notes', ex.id)
  const [hintsShown, setHintsShown] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [rated, setRated] = useState<Rating | null>(null)
  const [runKey, setRunKey] = useState(0)
  const [showNotes, setShowNotes] = useState(false)
  const reported = useRef(false)
  const allAttempts = useTable('attempts')
  const history = useMemo(() => (allAttempts || []).filter((a) => a.exerciseId === ex.id).sort((a, b) => b.ts - a.ts), [allAttempts, ex.id])

  useEffect(() => {
    setHintsShown(0)
    setShowSolution(false)
    setRated(null)
    setRunKey(0)
    reported.current = false
  }, [ex.id])

  const base = { exerciseId: ex.id, course: ex.course, week: ex.week, topics: ex.topics, difficulty: ex.difficulty, source: ex.source, generatorId: ex.generatorId, seed: ex.seed }
  const done = (score: number) => {
    if (reported.current) return
    reported.current = true
    onDone?.(score)
  }

  async function checked(r: CheckResult, value: string) {
    setShowSolution(true)
    const score = r.correct ? scoreWithHints(hintsShown) : 0
    await recordAttempt(store, { ...base, score, auto: true, answer: value.slice(0, 2000) }, r.correct ? (hintsShown ? 2 : 3) : 0)
    done(score)
  }

  async function rate(r: Rating) {
    setRated(r)
    // Seeing a hint caps the rating at "Kunne med hint".
    const effective = (hintsShown && r === 3 ? 2 : r) as Rating
    await recordAttempt(store, { ...base, score: RATING_SCORE[effective], rating: effective, answer: answer.slice(0, 4000) }, effective)
    done(RATING_SCORE[effective])
  }

  const isCode = ex.kind === 'code'
  const canRun = isCode && hasRunner('python')
  const quizCaps = ex.quiz ? { choices: !!ex.quiz.choices, typed: !!ex.quiz.check && ex.quiz.check.type !== 'choice' } : null
  // In "Kun multiple choice" a bank exercise with a quiz is answered through the quiz only.
  const freeAnswer = !ex.check && !(pref === 'mc' && quizCaps?.choices)

  return (
    <article className="card space-y-4" aria-labelledby={`ex-h-${ex.id}`}>
      <header className="flex flex-wrap items-center gap-2">
        <h3 id={`ex-h-${ex.id}`} className="text-base font-bold">
          {heading ?? (ex.number ? t('exercise.title', { n: ex.number }) : t('exercise.generic'))}
        </h3>
        <span className="chip" title={t('exercise.difficulty', { n: ex.difficulty })} style={{ color: 'var(--warn)' }}>
          {STARS[ex.difficulty]}
        </span>
        <span className="chip">{KIND_LABEL[ex.kind] ? t(KIND_LABEL[ex.kind]) : ex.kind}</span>
        {history.length > 0 && (
          <span className="chip ml-auto" title={t('exercise.lastAttempt')}>
            {t('exercise.attempts', { n: history.length, last: history[0].rating !== undefined ? t(RATING_LABEL[history[0].rating]).toLowerCase() : history[0].score >= 0.6 ? t('exercise.right') : t('exercise.wrong') })}
          </span>
        )}
      </header>

      <Html html={ex.promptHtml} className="reading" />

      {/* ---------- answer */}
      {ex.check ? (
        <AnswerInput key={ex.id} check={ex.check} choices={ex.choices} format={answerFormat({ choices: !!ex.choices, typed: ex.check.type !== 'choice' }, pref, ex.id)} onChecked={checked} />
      ) : (
        <>
          {quizCaps && ex.quiz && (
            <div className="rounded-xl p-4" style={{ background: 'var(--accent-soft)' }}>
              <div className="mb-1 text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                {t('exercise.checkYourself')}
              </div>
              <Html html={ex.quiz.question} />
              <div className="mt-3">
                <AnswerInput
                  key={`${ex.id}#quiz`}
                  check={ex.quiz.check || choiceCheck(ex.quiz.choices!)}
                  choices={ex.quiz.choices}
                  format={answerFormat(quizCaps, pref, ex.id)}
                  explainHtml={ex.quiz.explain}
                  onChecked={async (r, value) => {
                    const score = r.correct ? scoreWithHints(hintsShown) : 0
                    await recordAttempt(store, { ...base, score, auto: true, answer: value.slice(0, 500) }, r.correct ? (hintsShown ? 2 : 3) : 0)
                    if (!freeAnswer) setShowSolution(true)
                    done(score)
                  }}
                />
              </div>
            </div>
          )}
          {freeAnswer && (
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor={`ans-${ex.id}`}>
                {isCode ? t('exercise.yourCode') : t('answer.yours')} <span className="muted font-normal">{t('exercise.autosave')}</span>
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
                    const el = e.currentTarget
                    const s = el.selectionStart
                    setAnswer(answer.slice(0, s) + '    ' + answer.slice(el.selectionEnd))
                    requestAnimationFrame(() => (el.selectionStart = el.selectionEnd = s + 4))
                  }
                }}
                placeholder={isCode ? t('exercise.codePlaceholder') : t('exercise.answerPlaceholder')}
              />
              {canRun && (
                <div>
                  <button className="btn" onClick={() => setRunKey((k) => k + 1)} disabled={!answer.trim()}>
                    {t('exercise.run')}
                  </button>
                  {runKey > 0 && <CodeRunPanel key={runKey} lang="python" code={answer} />}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ---------- hints one at a time, then the solution */}
      {hintsShown > 0 && (
        <ol className="space-y-2">
          {ex.hintsHtml.slice(0, hintsShown).map((h, i) => (
            <li key={i} className="fade-in rounded-xl p-3" style={{ background: 'var(--warn-soft)' }}>
              <div className="mb-1 text-sm font-semibold">
                {ex.hintsHtml.length > 1 ? t('exercise.hintOf', { n: i + 1, total: ex.hintsHtml.length }) : t('exercise.hint', { n: i + 1 })}
              </div>
              <Html html={h} />
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap gap-2">
        {!showSolution && hintsShown < ex.hintsHtml.length && (
          <button className="btn" onClick={() => setHintsShown((n) => n + 1)}>
            💡 {hintsShown === 0 ? t('exercise.showHint') : t('exercise.nextHint')}
          </button>
        )}
        {!showSolution && (
          <button className={freeAnswer && hintsShown >= ex.hintsHtml.length ? 'btn btn-primary' : 'btn'} onClick={() => setShowSolution(true)}>
            {t('exercise.showSolution')}
          </button>
        )}
      </div>
      {hintsShown > 0 && !showSolution && <p className="muted -mt-2 text-xs">{t('exercise.hintCost')}</p>}
      {showSolution && (
        <div className="fade-in rounded-xl p-4" style={{ background: 'var(--surface-2)' }}>
          <div className="mb-1 text-sm font-semibold">{t('exercise.solution')}</div>
          <Html html={ex.solutionHtml} />
        </div>
      )}

      {/* ---------- self rating for free answers */}
      {showSolution && freeAnswer && (
        <div>
          <div className="mb-2 text-sm font-medium">{t('exercise.howDidItGo')}</div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('exercise.rateYourself')}>
            {([0, 1, 2, 3] as Rating[]).map((r) => (
              <button
                key={r}
                className="btn"
                style={rated === r ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-soft)' } : undefined}
                onClick={() => rate(r)}
                disabled={rated !== null}
                aria-pressed={rated === r}
              >
                {t(RATING_LABEL[r])}
              </button>
            ))}
          </div>
          {rated !== null && <p className="muted mt-2 text-sm">{t('exercise.saved')} {hintsShown && rated === 3 ? t('exercise.countedWithHint') : ''}</p>}
        </div>
      )}

      {/* ---------- notes + history */}
      {!compact && (
        <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          <button className="link text-sm font-medium" onClick={() => setShowNotes((s) => !s)} aria-expanded={showNotes}>
            {showNotes ? '▾' : '▸'} {t('exercise.notesAndAttempts')} {note ? '•' : ''}
          </button>
          {showNotes && (
            <div className="mt-2 space-y-3">
              <textarea className="input min-h-[4rem]" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('exercise.notePlaceholder')} aria-label={t('exercise.myNotes')} />
              {history.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {history.slice(0, 10).map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <span className="muted">{new Date(a.ts).toLocaleString(dateLocale(lang), { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span>{a.rating !== undefined ? t(RATING_LABEL[a.rating]) : a.score >= 0.6 ? `✓ ${t('exercise.right')}` : t('exercise.wrong')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted text-sm">{t('exercise.noAttempts')}</p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

/** Typed answer or multiple choice, with calm, immediate feedback. */
export function AnswerInput({
  check,
  choices,
  format,
  explainHtml,
  onChecked,
}: {
  check: AutoCheck
  choices?: Choices
  format: 'mc' | 'typed'
  explainHtml?: string
  onChecked: (r: CheckResult, value: string) => void
}) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [ask, setAsk] = useState('')
  const t = useT()
  const mc = format === 'mc' && choices
  const submit = (v: string) => {
    const r = mc ? evaluate(choiceCheck(choices), v) : evaluate(check, v)
    // an ambiguous answer (decimal comma) isn't graded: ask what was meant
    if (r.ask) return setAsk(r.message)
    setAsk('')
    const text = mc ? choices.options[Number(v)] : v
    // friendlier wording than the checker's
    const message = r.correct ? t('answer.right') : mc ? `${t('answer.notQuite')} ${t('answer.rightIs')} ${choices.options[choices.correct]}.` : r.message
    const res = { ...r, message }
    setResult(res)
    onChecked(res, text)
  }
  const feedback = result && (
    <div role="status" className="fade-in space-y-2 rounded-xl px-4 py-3 text-sm" style={{ background: result.correct ? 'var(--ok-soft)' : 'var(--warn-soft)' }}>
      <div className="font-medium" style={{ color: result.correct ? 'var(--ok)' : 'var(--text)' }}>
        {result.correct ? '✓ ' : ''}
        {mc && !result.correct ? (
          <>
            {t('answer.notQuite')}{choices.explanations?.[Number(value)] ? ` ${choices.explanations[Number(value)]}` : ''} {t('answer.rightIs')} <span dangerouslySetInnerHTML={{ __html: inlineMd(choices.options[choices.correct]) }} />.
          </>
        ) : (
          result.message
        )}
      </div>
      {explainHtml && <Html html={explainHtml} />}
    </div>
  )
  if (mc)
    return (
      <div className="space-y-2">
        <fieldset className="space-y-2" disabled={!!result}>
          <legend className="sr-only">{t('answer.pick')}</legend>
          {choices.options.map((o, i) => {
            const picked = value === String(i)
            const isRight = result && i === choices.correct
            const style: React.CSSProperties = isRight
              ? { borderColor: 'var(--ok)', background: 'var(--ok-soft)' }
              : result && picked
                ? { borderColor: 'var(--warn)', background: 'var(--warn-soft)' }
                : picked
                  ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' }
                  : { borderColor: 'var(--border)' }
            return (
              <label key={i} className="choice flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3" style={style}>
                <input type="radio" name={`choice-${choices.options.join('|')}`} value={i} checked={picked} onChange={() => setValue(String(i))} />
                <span className="min-w-0" dangerouslySetInnerHTML={{ __html: inlineMd(o) }} />
              </label>
            )
          })}
        </fieldset>
        {!result && (
          <button className="btn btn-primary" disabled={value === ''} onClick={() => submit(value)}>
            {t('answer.check')}
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
        if (value.trim() && !result) submit(value)
      }}
    >
      <label className="block text-sm font-medium">
        {t('answer.yours')}{' '}
        <span className="muted font-normal">
          {check.type === 'numeric' ? t('answer.numberHint', { unit: check.unit ? t('answer.unit', { unit: check.unit }) : '' }) : check.type === 'numeric-list' ? t('answer.listHint', { n: check.answers.length }) : ''}
        </span>
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        {multiline ? (
          <textarea className="input min-h-[5rem] font-mono" value={value} onChange={(e) => setValue(e.target.value)} disabled={!!result} />
        ) : (
          <input className="input" inputMode={check.type === 'numeric' ? 'decimal' : undefined} value={value} onChange={(e) => setValue(e.target.value)} disabled={!!result} autoComplete="off" />
        )}
        {!result && (
          <button type="submit" className="btn btn-primary shrink-0" disabled={!value.trim()}>
            {t('answer.check')}
          </button>
        )}
      </div>
      {ask && (
        <p role="status" className="text-sm" style={{ color: 'var(--warn)' }}>
          {ask}
        </p>
      )}
      {feedback}
    </form>
  )
}

/** Options are mini-Markdown (may hold $math$); render without the paragraph wrapper. */
function inlineMd(s: string): string {
  const html = miniMarkdown(s)
  const m = /^<p>([\s\S]*)<\/p>$/.exec(html.trim())
  return m ? m[1] : html
}
