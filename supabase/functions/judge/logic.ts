// The judge's logic, without Deno or Node APIs, so it is shared by the Edge
// Function (index.ts) and the unit tests (with a mocked Judge0). Hidden tests
// are judged here and only their verdict leaves the server.

export type Lang = 'python' | 'c' | 'cpp' | 'csharp' | 'nasm'
export type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE'

export interface Test {
  input: string
  output: string
}

export interface Limits {
  timeLimit: number // seconds
  memoryLimit: number // MB
}

/** Judge0 CE language ids. */
export const LANGUAGE_ID: Record<Lang, number> = { python: 71, c: 50, cpp: 54, csharp: 51, nasm: 45 }

export interface Judge0Submission {
  language_id: number
  source_code: string
  stdin: string
  cpu_time_limit: number
  wall_time_limit: number
  memory_limit: number // KB
}

export interface Judge0Result {
  status: { id: number; description?: string }
  stdout?: string | null
  stderr?: string | null
  compile_output?: string | null
  message?: string | null
  time?: string | null // seconds
  memory?: number | null // KB
}

/** Runs a batch on Judge0 (the real one over HTTP, or a fake in tests). Texts are plain (not base64). */
export interface Judge0Client {
  run(subs: Judge0Submission[]): Promise<Judge0Result[]>
}

export interface TestResult {
  verdict: Verdict
  hidden: boolean
  timeMs?: number
  memoryKb?: number
  /** Only for public tests. */
  input?: string
  expected?: string
  got?: string
  /** First line that differs (1-based), public tests only. */
  diffLine?: number
  /** Compiler or runtime message (trimmed). */
  message?: string
}

export interface JudgeResult {
  verdict: Verdict
  tests: TestResult[]
  passed: number
  total: number
}

const MAX_CODE = 64 * 1024
const clip = (s: string | null | undefined, n = 2000) => (s ? (s.length > n ? s.slice(0, n) + '…' : s) : '')

export function sameOutput(got: string, want: string): boolean {
  const norm = (s: string) => s.replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '')
  return norm(got) === norm(want)
}

function firstDiff(got: string, want: string): number {
  const a = got.replace(/\r\n/g, '\n').split('\n')
  const b = want.replace(/\r\n/g, '\n').split('\n')
  for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] ?? '').replace(/\s+$/, '') !== (b[i] ?? '').replace(/\s+$/, '')) return i + 1
  return 0
}

/** One Judge0 result → a verdict. Judge0 statuses: 3 accepted, 5 time limit, 6 compile error, 7–12 runtime errors. */
export function verdictOf(r: Judge0Result, test: Test, limits: Limits): Verdict {
  const id = r.status.id
  if (id === 6) return 'CE'
  if (id === 5) return 'TLE'
  const overMemory = (r.memory ?? 0) >= limits.memoryLimit * 1024
  if (id >= 7 && id <= 14) return overMemory || /memory/i.test(`${r.message || ''} ${r.stderr || ''}`) ? 'MLE' : 'RE'
  if (overMemory) return 'MLE'
  if (Number(r.time ?? 0) > limits.timeLimit) return 'TLE'
  if (id === 3 || id === 4) return sameOutput(r.stdout || '', test.output) ? 'AC' : 'WA'
  return 'RE'
}

export function checkSubmission(lang: string, code: string, allowed: Lang[]): string | null {
  if (!(allowed as string[]).includes(lang)) return `Opgaven kan ikke løses i "${lang}".`
  if (!code.trim()) return 'Der er ingen kode.'
  if (code.length > MAX_CODE) return 'Koden er for lang (højst 64 KB).'
  return null
}

/**
 * Judge code on public tests (shown in full) and hidden tests (only their
 * verdict). Every test runs; the overall verdict is the first one that isn't AC.
 */
export async function judge(client: Judge0Client, lang: Lang, code: string, tests: { public: Test[]; hidden: Test[] }, limits: Limits): Promise<JudgeResult> {
  const all = [...tests.public.map((t) => ({ t, hidden: false })), ...tests.hidden.map((t) => ({ t, hidden: true }))]
  const time = Math.min(limits.timeLimit, 10)
  const subs = all.map(({ t }) => ({ language_id: LANGUAGE_ID[lang], source_code: code, stdin: t.input, cpu_time_limit: time, wall_time_limit: Math.min(time * 3, 20), memory_limit: Math.min(limits.memoryLimit, 256) * 1024 }))
  const results = await client.run(subs)
  const out: TestResult[] = results.map((r, i) => {
    const { t, hidden } = all[i]
    const verdict = verdictOf(r, t, limits)
    const base: TestResult = { verdict, hidden, timeMs: r.time ? Math.round(Number(r.time) * 1000) : undefined, memoryKb: r.memory ?? undefined }
    if (verdict === 'CE') return { ...base, message: clip(r.compile_output, 3000) }
    if (hidden) return base // never the input, expected or actual output of a hidden test
    const got = r.stdout || ''
    return { ...base, input: clip(t.input), expected: clip(t.output), got: clip(got), ...(verdict === 'WA' ? { diffLine: firstDiff(got, t.output) } : {}), ...(verdict === 'RE' ? { message: clip(r.stderr || r.message, 1500) } : {}) }
  })
  const failed = out.find((r) => r.verdict !== 'AC')
  return { verdict: failed ? failed.verdict : 'AC', tests: out, passed: out.filter((r) => r.verdict === 'AC').length, total: out.length }
}

/** Sliding-window rate limit: at most `perMinute` and `perDay` judge calls per learner. */
export function rateLimited(timestamps: number[], now: number, perMinute = 10, perDay = 300): string | null {
  const minute = timestamps.filter((t) => t > now - 60_000).length
  const day = timestamps.filter((t) => t > now - 86_400_000).length
  if (minute >= perMinute) return 'Du har sendt mange forsøg på kort tid. Vent et minut, og prøv igen.'
  if (day >= perDay) return 'Du har brugt dagens forsøg hos dommeren. Prøv igen i morgen — Python kan stadig køres i browseren.'
  return null
}

/** Judge0 over HTTP (RapidAPI or self-hosted), base64 in both directions, polling until done. */
export function httpJudge0(opts: { url: string; headers: Record<string, string>; fetch: typeof fetch; sleep: (ms: number) => Promise<void>; b64: (s: string) => string; unb64: (s: string) => string }): Judge0Client {
  return {
    async run(subs) {
      const enc = subs.map((s) => ({ ...s, source_code: opts.b64(s.source_code), stdin: opts.b64(s.stdin) }))
      const created = await opts.fetch(`${opts.url}/submissions/batch?base64_encoded=true`, { method: 'POST', headers: { 'content-type': 'application/json', ...opts.headers }, body: JSON.stringify({ submissions: enc }) })
      if (!created.ok) throw new Error(`Dommeren svarede ${created.status}.`)
      const tokens = ((await created.json()) as { token: string }[]).map((x) => x.token)
      for (let attempt = 0; attempt < 40; attempt++) {
        await opts.sleep(attempt < 5 ? 500 : 1500)
        const res = await opts.fetch(`${opts.url}/submissions/batch?tokens=${tokens.join(',')}&base64_encoded=true&fields=status,stdout,stderr,compile_output,message,time,memory`, { headers: opts.headers })
        if (!res.ok) throw new Error(`Dommeren svarede ${res.status}.`)
        const list = ((await res.json()) as { submissions: Judge0Result[] }).submissions
        if (list.every((r) => r.status.id > 2))
          return list.map((r) => ({ ...r, stdout: r.stdout ? opts.unb64(r.stdout) : r.stdout, stderr: r.stderr ? opts.unb64(r.stderr) : r.stderr, compile_output: r.compile_output ? opts.unb64(r.compile_output) : r.compile_output, message: r.message ? opts.unb64(r.message) : r.message }))
      }
      throw new Error('Dommeren blev ikke færdig i tide. Prøv igen.')
    },
  }
}
