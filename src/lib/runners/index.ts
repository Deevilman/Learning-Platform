import type { Key } from '@/i18n/translate'
import type { CodeRunner } from './types'

export type { CodeRunner, RunResult, RunOptions } from './types'

/**
 * Registry: language → lazy runner. To add C or assembly later, implement
 * CodeRunner (e.g. a WASM toolchain in a worker, or a sandbox API) and add
 * it here. Languages without a runner fall back to "show reference
 * solution + compare output manually".
 */
const RUNNERS: Record<string, () => Promise<CodeRunner>> = {
  python: () => import('./python').then((m) => m.pythonRunner),
  py: () => import('./python').then((m) => m.pythonRunner),
}

export const hasRunner = (lang: string) => lang.toLowerCase() in RUNNERS

export async function getRunner(lang: string): Promise<CodeRunner | null> {
  const f = RUNNERS[lang.toLowerCase()]
  return f ? f() : null
}

/** External playgrounds for languages we cannot run in the browser. */
export function externalPlayground(lang: string, code: string): { label: Key; url: string } | null {
  const l = lang.toLowerCase()
  if (l === 'lean' || l === 'lean4') return { label: 'code.lean', url: `https://live.lean-lang.org/#code=${encodeURIComponent(code)}` }
  return null
}
