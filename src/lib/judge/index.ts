// The code judge from the app's side. "Kør" runs the public tests — Python
// right here in the browser (Pyodide), other languages via the judge. "Indsend"
// always goes to the judge, which also runs the hidden tests (they never come
// to the browser).

import type { CodeProblem, JudgeLanguage, ProblemTest } from '@/types/content'
import { getRunner } from '../runners'
import { getSession, supabase } from '../storage/supabase-sync'
import { tr } from '@/i18n/translate'
import { sameOutput, type JudgeResult, type TestResult } from '../../../supabase/functions/judge/logic'

export type { JudgeResult, TestResult, Verdict } from '../../../supabase/functions/judge/logic'

export interface JudgeError {
  error: string
  login?: boolean
}

/** Run Python on the given tests in the browser. Memory isn't measured here, so no MLE. */
export async function runPythonLocally(code: string, tests: ProblemTest[], timeLimit: number, hidden = 0, onStatus?: (s: string) => void): Promise<JudgeResult> {
  const runner = await getRunner('python')
  if (!runner) throw new Error(tr('run.unsupported'))
  const out: TestResult[] = []
  for (const [i, t] of tests.entries()) {
    const r = await runner.run(code, { stdin: t.input, timeoutMs: Math.max(3000, timeLimit * 3000), onStatus })
    const isHidden = i >= tests.length - hidden
    const verdict = r.timedOut ? 'TLE' : r.error ? 'RE' : sameOutput(r.stdout, t.output) ? 'AC' : 'WA'
    out.push(isHidden ? { verdict, hidden: true, timeMs: r.ms } : { verdict, hidden: false, timeMs: r.ms, input: t.input, expected: t.output, got: r.stdout, ...(r.error ? { message: r.error.slice(-1500) } : {}) })
  }
  const failed = out.find((r) => r.verdict !== 'AC')
  return { verdict: failed ? failed.verdict : 'AC', tests: out, passed: out.filter((r) => r.verdict === 'AC').length, total: out.length }
}

/** Call the judge (Supabase Edge Function "judge"). */
export async function callJudge(body: { mode: 'run' | 'submit' | 'check'; course: string; problemId: string; language?: JudgeLanguage; code?: string; stdin?: string }): Promise<JudgeResult | { output: TestResult } | JudgeError> {
  const session = await getSession().catch(() => null)
  if (!session) return { error: tr('judge.login'), login: true }
  const sb = await supabase()
  const { data, error } = await sb.functions.invoke('judge', { body })
  if (error) {
    // the function answers with { error } and a status code; supabase-js wraps it
    const ctx = (error as { context?: Response }).context
    const msg = ctx && typeof ctx.json === 'function' ? await ctx.json().then((j: { error?: string }) => j.error).catch(() => null) : null
    return { error: msg || tr('judge.unavailable') }
  }
  return data
}

/** "Kør": public tests only. */
export function runPublic(problem: CodeProblem, language: JudgeLanguage, code: string, onStatus?: (s: string) => void) {
  if (language === 'python') return runPythonLocally(code, problem.publicTests, problem.timeLimit, 0, onStatus)
  return callJudge({ mode: 'run', course: problem.course, problemId: problem.id, language, code })
}

/** "Indsend": public + hidden tests on the judge. */
export function submit(problem: CodeProblem, language: JudgeLanguage, code: string) {
  return callJudge({ mode: 'submit', course: problem.course, problemId: problem.id, language, code })
}

export const isError = (r: unknown): r is JudgeError => !!r && typeof r === 'object' && 'error' in r
