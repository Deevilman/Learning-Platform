// Supabase Edge Function "judge": the only way learners' code reaches Judge0.
// It checks the login, rate-limits, caps time and memory, and judges against
// the hidden tests, which never leave the server. Secrets (set with
// `supabase secrets set`): JUDGE0_API_KEY, and optionally JUDGE0_URL and
// JUDGE0_HOST for another Judge0 than RapidAPI's.
//
// Request:  { mode: 'run' | 'submit' | 'check', course, problemId, language, code, stdin? }
// Response: JudgeResult (see logic.ts), or { output } for a custom input, or { error }.

import { createClient } from 'npm:@supabase/supabase-js@2'
import YAML from 'npm:yaml@2'
import { checkSubmission, httpJudge0, judge, rateLimited, type Lang, type Test } from './logic.ts'

interface ServerProblem {
  id: string
  course: string
  languages: Lang[]
  timeLimit: number
  memoryLimit: number
  publicTests: Test[]
  hiddenTests: Test[]
  reference: { language: Lang; code: string }
}

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type', 'access-control-allow-methods': 'POST, OPTIONS' }
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

const url = Deno.env.get('JUDGE0_URL') || 'https://judge0-ce.p.rapidapi.com'
const host = Deno.env.get('JUDGE0_HOST') || new URL(url).host
const key = Deno.env.get('JUDGE0_API_KEY') || ''
const judge0 = httpJudge0({
  url,
  headers: key ? { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host } : {},
  fetch,
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  b64: (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))),
  unb64: (s) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))),
})

/** A problem from the site (table problem_tests) or from the learner's own uploaded course file. */
async function loadProblem(admin: ReturnType<typeof createClient>, userId: string, course: string, id: string): Promise<ServerProblem | null> {
  const { data } = await admin.from('problem_tests').select('data').eq('id', id).maybeSingle()
  if (data?.data) return data.data as ServerProblem
  const file = await admin.storage.from('courses').download(`${userId}/${course}.md`)
  if (file.error || !file.data) return null
  const text = await file.data.text()
  for (const m of text.matchAll(/^```problem\n([\s\S]*?)\n```\s*$/gm)) {
    const p = YAML.parse(m[1])
    if (p?.id !== id) continue
    const tests = (x: unknown): Test[] => (Array.isArray(x) ? x.map((t: any) => ({ input: String(t.input ?? ''), output: String(t.output) })) : [])
    return { id, course, languages: p.sprog, timeLimit: Number(p.tid ?? 2), memoryLimit: Number(p.hukommelse ?? 128), publicTests: tests(p.offentlige_tests), hiddenTests: tests(p.skjulte_tests), reference: { language: p.reference?.sprog, code: String(p.reference?.kode ?? '') } }
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply({ error: 'Brug POST.' }, 405)
  if (!key && !Deno.env.get('JUDGE0_URL')) return reply({ error: 'Dommeren er ikke sat op endnu.' }, 503)

  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer /, '')
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: auth } = await admin.auth.getUser(jwt)
  if (!auth?.user) return reply({ error: 'Log ind for at sende kode til dommeren.' }, 401)
  const userId = auth.user.id

  let body: { mode?: string; course?: string; problemId?: string; language?: Lang; code?: string; stdin?: string }
  try {
    body = await req.json()
  } catch {
    return reply({ error: 'Ugyldig forespørgsel.' }, 400)
  }
  const { mode = 'run', course = '', problemId = '', language = 'python' } = body

  // rate limit per learner (sliding windows), counted before judging
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const { data: usage } = await admin.from('judge_usage').select('ts').eq('user_id', userId).gte('ts', since)
  const limited = rateLimited((usage || []).map((u: { ts: string }) => Date.parse(u.ts)), Date.now())
  if (limited) return reply({ error: limited }, 429)
  await admin.from('judge_usage').insert({ user_id: userId })

  const problem = await loadProblem(admin, userId, course, problemId)
  if (!problem) return reply({ error: 'Opgaven findes ikke.' }, 404)
  const limits = { timeLimit: Math.min(problem.timeLimit, 10), memoryLimit: Math.min(problem.memoryLimit, 256) }

  try {
    if (mode === 'check') {
      // the reference solution of the learner's own uploaded course, on all tests
      const r = await judge(judge0, problem.reference.language, problem.reference.code, { public: problem.publicTests, hidden: problem.hiddenTests }, limits)
      return reply(r)
    }
    const code = body.code || ''
    const bad = checkSubmission(language, code, problem.languages)
    if (bad) return reply({ error: bad }, 400)
    if (mode === 'run' && typeof body.stdin === 'string') {
      const r = await judge(judge0, language, code, { public: [{ input: body.stdin.slice(0, 65536), output: '' }], hidden: [] }, limits)
      return reply({ output: r.tests[0] })
    }
    const r = await judge(judge0, language, code, { public: problem.publicTests, hidden: mode === 'submit' ? problem.hiddenTests : [] }, limits)
    if (mode === 'submit') await admin.from('submissions').insert({ user_id: userId, problem_id: problemId, language, verdict: r.verdict, passed: r.passed, total: r.total })
    return reply(r)
  } catch (e) {
    return reply({ error: (e as Error).message }, 502)
  }
})
