// Coding problems ("kodeopgaver") from ```problem blocks. The public part
// (statement, public tests, hints, editorial) goes to the app; the hidden
// tests and the reference solution only go to the server (the judge), never
// into the bundle. Isomorphic: used by the build and by uploads in the browser.

import type { CodeProblem, JudgeLanguage, ProblemTest } from '../../src/types/content.ts'

export const JUDGE_LANGUAGES: JudgeLanguage[] = ['python', 'c', 'cpp', 'csharp', 'nasm']
export const LANGUAGE_LABEL: Record<JudgeLanguage, string> = { python: 'Python', c: 'C', cpp: 'C++', csharp: 'C#', nasm: 'NASM (x86-64)' }

/** What only the judge may see. */
export interface ServerProblem {
  id: string
  course: string
  languages: JudgeLanguage[]
  timeLimit: number
  memoryLimit: number
  publicTests: ProblemTest[]
  hiddenTests: ProblemTest[]
  reference: { language: JudgeLanguage; code: string }
}

const ID_RE = /^[a-z0-9][a-z0-9/_-]*$/
const KEYS = new Set(['id', 'titel', 'svaerhed', 'emner', 'sprog', 'tid', 'hukommelse', 'opgave', 'offentlige_tests', 'skjulte_tests', 'reference', 'hints', 'loesning', 'startkode', 'uge'])

export function buildProblem(
  raw: any,
  ctx: { course: string; topics: Set<string>; md: (s: string) => string; inl: (s: string) => string },
): { problem?: CodeProblem; server?: ServerProblem; errors: string[] } {
  const e: string[] = []
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { errors: ['En problem-blok skal være en YAML-ordbog (felt: værdi).'] }
  for (const k of Object.keys(raw)) if (!KEYS.has(k)) e.push(`Ukendt felt "${k}".`)
  if (typeof raw.id !== 'string' || !ID_RE.test(raw.id)) e.push('Feltet "id" mangler eller indeholder andet end små bogstaver, tal, "-", "_" og "/".')
  if (typeof raw.titel !== 'string' || !raw.titel.trim()) e.push('Feltet "titel" mangler.')
  if (![1, 2, 3].includes(raw.svaerhed)) e.push('Feltet "svaerhed" skal være 1, 2 eller 3.')
  const topics: string[] = Array.isArray(raw.emner) ? raw.emner.map(String) : []
  if (!topics.length) e.push('Feltet "emner" skal være en liste med mindst ét emne.')
  for (const t of topics) if (!ctx.topics.has(t)) e.push(`Emnet "${t}" står ikke under "topics" i front matter.`)
  const langs: JudgeLanguage[] = Array.isArray(raw.sprog) ? raw.sprog.map(String) : []
  if (!langs.length) e.push(`Feltet "sprog" skal være en liste, fx [python, c]. Mulige: ${JUDGE_LANGUAGES.join(', ')}.`)
  for (const l of langs) if (!JUDGE_LANGUAGES.includes(l)) e.push(`Sproget "${l}" kan ikke bruges. Mulige: ${JUDGE_LANGUAGES.join(', ')}.`)
  const timeLimit = raw.tid === undefined ? 2 : Number(raw.tid)
  if (!(timeLimit > 0 && timeLimit <= 10)) e.push('"tid" skal være sekunder mellem 0 og 10.')
  const memoryLimit = raw.hukommelse === undefined ? 128 : Number(raw.hukommelse)
  if (!(memoryLimit >= 16 && memoryLimit <= 256)) e.push('"hukommelse" skal være MB mellem 16 og 256.')
  if (typeof raw.opgave !== 'string' || !raw.opgave.trim()) e.push('Feltet "opgave" (opgaveteksten) mangler.')
  const tests = (x: unknown, name: string): ProblemTest[] => {
    if (!Array.isArray(x) || !x.length) {
      e.push(`"${name}" skal være en liste med mindst én test ({ input: …, output: … }).`)
      return []
    }
    return x.flatMap((t: any, i: number) => {
      if (!t || typeof t !== 'object' || t.output === undefined) {
        e.push(`${name}[${i + 1}] skal have "output" (og gerne "input").`)
        return []
      }
      return [{ input: t.input === undefined ? '' : String(t.input), output: String(t.output) }]
    })
  }
  const publicTests = tests(raw.offentlige_tests, 'offentlige_tests')
  const hiddenTests = tests(raw.skjulte_tests, 'skjulte_tests')
  const ref = raw.reference
  if (!ref || typeof ref !== 'object' || !ref.sprog || typeof ref.kode !== 'string') e.push('Feltet "reference" skal have "sprog" og "kode" (en løsning, der består alle tests).')
  else if (!langs.includes(ref.sprog)) e.push(`Referenceløsningen er skrevet i "${ref.sprog}", som ikke står under "sprog".`)
  const hints: string[] = Array.isArray(raw.hints) ? raw.hints.map(String) : []
  if (!hints.length) e.push('Feltet "hints" skal være en liste med mindst ét hint.')
  if (typeof raw.loesning !== 'string' || !raw.loesning.trim()) e.push('Feltet "loesning" (gennemgangen af løsningen) mangler.')
  const starter: Partial<Record<JudgeLanguage, string>> = {}
  if (raw.startkode !== undefined) {
    if (typeof raw.startkode !== 'object') e.push('"startkode" skal være en ordbog sprog: kode.')
    else for (const [l, c] of Object.entries(raw.startkode)) if (JUDGE_LANGUAGES.includes(l as JudgeLanguage)) starter[l as JudgeLanguage] = String(c)
  }
  if (e.length) return { errors: e }
  const problem: CodeProblem = {
    id: raw.id,
    course: ctx.course,
    title: raw.titel,
    difficulty: raw.svaerhed,
    topics,
    languages: langs,
    timeLimit,
    memoryLimit,
    statementHtml: ctx.md(raw.opgave),
    publicTests,
    hiddenCount: hiddenTests.length,
    hintsHtml: hints.map(ctx.md),
    editorialHtml: ctx.md(raw.loesning),
    starter,
    ...(raw.uge ? { week: Number(raw.uge) } : {}),
  }
  const server: ServerProblem = { id: raw.id, course: ctx.course, languages: langs, timeLimit, memoryLimit, publicTests, hiddenTests, reference: { language: ref.sprog, code: ref.kode } }
  return { problem, server, errors: [] }
}

/** Output comparison: trailing spaces on each line and trailing blank lines don't matter. */
export function sameOutput(got: string, want: string): boolean {
  const norm = (s: string) => s.replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '')
  return norm(got) === norm(want)
}
