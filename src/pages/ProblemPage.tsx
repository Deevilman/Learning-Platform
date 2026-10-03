// One coding problem: statement and examples, a code editor per language,
// "Kør" (public tests) and "Indsend" (the judge, with the hidden tests), the
// verdict per test, hints one at a time, the walkthrough, and the history.

import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { uid, useSetting, useStore, useTable } from '@/lib/store'
import { codeAttemptId, problemStatus } from '@/lib/code-problems'
import { isError, runPublic, submit, type JudgeResult, type TestResult, type Verdict } from '@/lib/judge'
import { LANGUAGE_LABEL } from '../../scripts/lib/problems'
import { Html } from '@/components/Html'
import { STARS } from '@/components/ExerciseCard'
import { Crumbs, ErrorBox, Loading } from '@/components/ui'
import { dateLocale, useLang, useT, type Key } from '@/i18n'
import { STATUS_KEY } from './ProblemsPage'
import type { CodeProblem, JudgeLanguage } from '@/types/content'

export const VERDICT_KEY: Record<Verdict, Key> = { AC: 'verdict.AC', WA: 'verdict.WA', TLE: 'verdict.TLE', MLE: 'verdict.MLE', RE: 'verdict.RE', CE: 'verdict.CE' }

export default function ProblemPage() {
  const t = useT()
  const [params] = useSearchParams()
  const id = params.get('id') || ''
  const { data, error } = useAsync(async () => {
    const idx = await loadIndex()
    for (const c of idx.courses) {
      const course = await loadCourse(c.slug)
      const p = course.problems?.find((x) => x.id === id)
      if (p) return { problem: p, courseTitle: course.meta.title }
    }
    return null
  }, [id])
  if (error) return <ErrorBox error={error} />
  if (data === undefined) return <Loading />
  if (data === null) return <p>{t('notFound.title')}.</p>
  return <Problem key={id} problem={data.problem} courseTitle={data.courseTitle} />
}

function Problem({ problem: p, courseTitle }: { problem: CodeProblem; courseTitle: string }) {
  const t = useT()
  const [lang] = useLang()
  const store = useStore()
  const subs = useTable('submissions')
  const [language, setLanguage] = useSetting<JudgeLanguage>(`code.lang:${p.id}`, p.languages[0])
  const codeId = `code:${p.id}:${language}`
  const [code, setCode] = useState<string | null>(null)
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<{ kind: 'run' | 'submit'; r: JudgeResult } | { kind: 'error'; message: string } | null>(null)
  const [hints, setHints] = useState(0)
  const [showEditorial, setShowEditorial] = useState(false)
  const mine = useMemo(() => (subs || []).filter((s) => s.problemId === p.id && !s.deleted).sort((a, b) => b.ts - a.ts), [subs, p.id])
  const solved = problemStatus(p.id, mine) === 'solved'

  // the code is saved per problem and language, like answers
  useEffect(() => {
    store.get('answers', codeId).then((r) => setCode(r?.text ?? p.starter[language] ?? ''))
  }, [store, codeId, p, language])
  useEffect(() => {
    if (code === null) return
    const timer = setTimeout(() => store.put('answers', { id: codeId, text: code }), 500)
    return () => clearTimeout(timer)
  }, [code, codeId, store])

  async function go(kind: 'run' | 'submit') {
    if (!code?.trim()) return
    setBusy(kind)
    setResult(null)
    try {
      const r = kind === 'run' ? await runPublic(p, language, code, setStatus) : await submit(p, language, code)
      if (isError(r)) return setResult({ kind: 'error', message: r.error })
      if (!('verdict' in r)) return
      setResult({ kind, r })
      if (kind === 'submit') {
        const now = Date.now()
        await store.put('submissions', { id: uid(), problemId: p.id, course: p.course, language, verdict: r.verdict, passed: r.passed, total: r.total, code: code.slice(0, 65536), ts: now })
        // counts in the topics' mastery like any exercise
        await store.put('attempts', { id: uid(), exerciseId: codeAttemptId(p.id), course: p.course, week: p.week || 0, topics: p.topics, difficulty: p.difficulty, score: r.verdict === 'AC' ? 1 : r.passed / Math.max(1, r.total) / 2, auto: true, source: 'judge', ts: now })
      }
    } catch (e) {
      setResult({ kind: 'error', message: (e as Error).message })
    } finally {
      setBusy(null)
      setStatus('')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Crumbs items={[{ to: '/kode', label: t('nav.code') }, { to: `/kode?kursus=${p.course}`, label: courseTitle }, { label: p.title }]} />
      <header className="space-y-1">
        <h1 className="page-title">{p.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span style={{ color: 'var(--warn)' }}>{STARS[p.difficulty]}</span>
          <span className="chip">{t(STATUS_KEY[problemStatus(p.id, mine)])}</span>
          <span className="muted">{t('code.limits', { s: p.timeLimit, mb: p.memoryLimit })}</span>
        </div>
      </header>
      <Html html={p.statementHtml} className="card reading" />
      <section className="card space-y-2">
        <h2 className="section-title">{t('code.examples')}</h2>
        {p.publicTests.map((x, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-2">
            <Pre label={t('code.input')} text={x.input} />
            <Pre label={t('code.output')} text={x.output} />
          </div>
        ))}
        <p className="muted text-xs">{t('code.hiddenNote', { n: p.hiddenCount })}</p>
      </section>

      <section className="card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold" htmlFor="lang-sel">
            {t('code.language')}
          </label>
          <select id="lang-sel" className="input w-auto" value={language} onChange={(e) => (setLanguage(e.target.value as JudgeLanguage), setResult(null))}>
            {p.languages.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_LABEL[l]}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="input min-h-[14rem] font-mono text-sm"
          spellCheck={false}
          value={code ?? ''}
          onChange={(e) => setCode(e.target.value)}
          aria-label={t('exercise.yourCode')}
          onKeyDown={(e) => {
            if (e.key !== 'Tab') return
            e.preventDefault()
            const el = e.currentTarget
            const s = el.selectionStart
            setCode((code ?? '').slice(0, s) + '    ' + (code ?? '').slice(el.selectionEnd))
            requestAnimationFrame(() => (el.selectionStart = el.selectionEnd = s + 4))
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" disabled={!!busy || !code?.trim()} onClick={() => go('run')}>
            {busy === 'run' ? t('run.running') : t('code.runPublic')}
          </button>
          <button className="btn btn-primary" disabled={!!busy || !code?.trim()} onClick={() => go('submit')}>
            {busy === 'submit' ? t('code.judging') : t('code.submit')}
          </button>
          <span className="muted text-xs">{status || (language === 'python' ? t('code.runLocal') : t('code.runJudge'))}</span>
        </div>
        {result && <ResultView result={result} />}
      </section>

      <section className="card space-y-3">
        {p.hintsHtml.slice(0, hints).map((h, i) => (
          <div key={i} className="fade-in rounded-xl p-3" style={{ background: 'var(--warn-soft)' }}>
            <div className="mb-1 text-sm font-semibold">{t('exercise.hintOf', { n: i + 1, total: p.hintsHtml.length })}</div>
            <Html html={h} />
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {hints < p.hintsHtml.length && (
            <button className="btn" onClick={() => setHints(hints + 1)}>
              💡 {hints ? t('exercise.nextHint') : t('exercise.showHint')}
            </button>
          )}
          {!showEditorial && (
            <button className={solved ? 'btn btn-primary' : 'btn'} onClick={() => setShowEditorial(true)}>
              {t('code.editorial')}
            </button>
          )}
        </div>
        {showEditorial && (
          <div className="fade-in rounded-xl p-4" style={{ background: 'var(--surface-2)' }}>
            <div className="mb-1 text-sm font-semibold">{t('code.editorial')}</div>
            <Html html={p.editorialHtml} />
          </div>
        )}
      </section>

      {mine.length > 0 && (
        <section className="card space-y-2">
          <h2 className="section-title">{t('code.history')}</h2>
          <ul className="space-y-1 text-sm">
            {mine.slice(0, 20).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2">
                <VerdictChip verdict={s.verdict} />
                <span className="muted">
                  {new Date(s.ts).toLocaleString(dateLocale(lang), { dateStyle: 'short', timeStyle: 'short' })} · {LANGUAGE_LABEL[s.language as JudgeLanguage] || s.language} · {s.passed}/{s.total}
                </span>
                <button className="link text-xs" onClick={() => (setLanguage(s.language as JudgeLanguage), setCode(s.code))}>
                  {t('code.loadCode')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-center">
        <Link className="link" to="/kode">
          {t('code.back')}
        </Link>
      </p>
    </div>
  )
}

function ResultView({ result }: { result: { kind: 'run' | 'submit'; r: JudgeResult } | { kind: 'error'; message: string } }) {
  const t = useT()
  if (result.kind === 'error')
    return (
      <p role="status" className="rounded-xl p-3 text-sm" style={{ background: 'var(--warn-soft)' }}>
        {result.message}
      </p>
    )
  const { r, kind } = result
  const ce = r.tests.find((x) => x.verdict === 'CE')
  return (
    <div role="status" className="space-y-2 rounded-xl p-3" style={{ background: r.verdict === 'AC' ? 'var(--ok-soft)' : 'var(--surface-2)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <VerdictChip verdict={r.verdict} />
        <span className="text-sm">{t(kind === 'run' ? 'code.publicPassed' : 'code.allPassed', { n: r.passed, total: r.total })}</span>
      </div>
      {ce ? (
        <Pre label={t('verdict.CE')} text={ce.message || ''} />
      ) : (
        <ul className="space-y-2 text-sm">
          {r.tests.map((x, i) => (
            <TestRow key={i} n={i + 1} test={x} />
          ))}
        </ul>
      )}
      {kind === 'run' && r.verdict === 'AC' && <p className="muted text-xs">{t('code.nowSubmit')}</p>}
    </div>
  )
}

function TestRow({ n, test: x }: { n: number; test: TestResult }) {
  const t = useT()
  return (
    <li className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{t(x.hidden ? 'code.hiddenTest' : 'code.test', { n })}</span>
        <VerdictChip verdict={x.verdict} />
        {x.timeMs !== undefined && <span className="muted text-xs">{x.timeMs} ms</span>}
      </div>
      {!x.hidden && x.verdict === 'WA' && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Pre label={t('code.expected')} text={x.expected || ''} />
          <Pre label={x.diffLine ? t('code.gotDiff', { n: x.diffLine }) : t('code.got')} text={x.got || ''} />
        </div>
      )}
      {!x.hidden && x.message && <Pre label={t('code.message')} text={x.message} />}
    </li>
  )
}

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const t = useT()
  return (
    <span className="chip font-mono text-xs" title={t(VERDICT_KEY[verdict])} style={verdict === 'AC' ? { background: 'var(--ok-soft)', color: 'var(--ok)' } : { background: 'var(--bad-soft)', color: 'var(--bad)' }}>
      {verdict} · {t(VERDICT_KEY[verdict])}
    </span>
  )
}

function Pre({ label, text }: { label: string; text: string }) {
  return (
    <div className="min-w-0">
      <div className="muted text-xs">{label}</div>
      <pre className="run-output overflow-x-auto whitespace-pre-wrap text-xs">{text || ' '}</pre>
    </div>
  )
}
