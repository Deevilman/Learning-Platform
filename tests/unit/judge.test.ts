import { describe, expect, it } from 'vitest'
import { checkSubmission, httpJudge0, judge, rateLimited, verdictOf, type Judge0Client, type Judge0Result, type Judge0Submission } from '../../supabase/functions/judge/logic'

const limits = { timeLimit: 1, memoryLimit: 64 }
const ok = (stdout: string, extra: Partial<Judge0Result> = {}): Judge0Result => ({ status: { id: 3 }, stdout, time: '0.01', memory: 3000, ...extra })

/** A fake Judge0 that "runs" a tiny program: it answers per stdin from a table. */
function fakeJudge(answers: Record<string, Judge0Result>): Judge0Client & { seen: Judge0Submission[] } {
  const seen: Judge0Submission[] = []
  return {
    seen,
    async run(subs) {
      seen.push(...subs)
      return subs.map((s) => answers[s.stdin] ?? ok(''))
    },
  }
}

const tests = { public: [{ input: '1 2', output: '3\n' }], hidden: [{ input: '5 5', output: '10\n' }, { input: '0 0', output: '0\n' }] }

describe('judge verdicts (mocked Judge0)', () => {
  it('AC when every test passes', async () => {
    const r = await judge(fakeJudge({ '1 2': ok('3\n'), '5 5': ok('10'), '0 0': ok('0  \n') }), 'python', 'print(sum(...))', tests, limits)
    expect(r).toMatchObject({ verdict: 'AC', passed: 3, total: 3 })
  })
  it('WA shows the diff on a public test only, never a hidden test', async () => {
    const pub = await judge(fakeJudge({ '1 2': ok('4\n'), '5 5': ok('10'), '0 0': ok('0') }), 'c', 'x', tests, limits)
    expect(pub.verdict).toBe('WA')
    expect(pub.tests[0]).toMatchObject({ verdict: 'WA', input: '1 2', expected: '3\n', got: '4\n', diffLine: 1, hidden: false })
    const hid = await judge(fakeJudge({ '1 2': ok('3'), '5 5': ok('11'), '0 0': ok('0') }), 'c', 'x', tests, limits)
    expect(hid.verdict).toBe('WA')
    expect(hid.tests[1]).toEqual({ verdict: 'WA', hidden: true, timeMs: 10, memoryKb: 3000 })
    expect(JSON.stringify(hid)).not.toMatch(/5 5|10\\n|11/)
  })
  it('TLE, MLE, RE and CE', () => {
    const t = { input: '', output: '1' }
    expect(verdictOf({ status: { id: 5 } }, t, limits)).toBe('TLE')
    expect(verdictOf(ok('1', { time: '1.5' }), t, limits)).toBe('TLE')
    expect(verdictOf(ok('1', { memory: 70_000 }), t, limits)).toBe('MLE')
    expect(verdictOf({ status: { id: 11 }, memory: 65_600 }, t, limits)).toBe('MLE')
    expect(verdictOf({ status: { id: 11 }, stderr: 'ZeroDivisionError' }, t, limits)).toBe('RE')
    expect(verdictOf({ status: { id: 6 }, compile_output: 'error: expected ;' }, t, limits)).toBe('CE')
  })
  it('a compile error is reported once with the compiler message', async () => {
    const ce = { status: { id: 6 }, compile_output: 'main.c:1: error' }
    const r = await judge(fakeJudge({ '1 2': ce, '5 5': ce, '0 0': ce }), 'c', 'int main( {', tests, limits)
    expect(r.verdict).toBe('CE')
    expect(r.tests[0].message).toContain('main.c:1')
  })
  it('caps time and memory and sends the right language', async () => {
    const j = fakeJudge({})
    await judge(j, 'nasm', 'x', { public: [{ input: 'a', output: '' }], hidden: [] }, { timeLimit: 30, memoryLimit: 1024 })
    expect(j.seen[0]).toMatchObject({ language_id: 45, cpu_time_limit: 10, memory_limit: 256 * 1024 })
  })
  it('refuses empty, too long or wrong-language code', () => {
    expect(checkSubmission('python', '', ['python'])).toMatch(/ingen kode/)
    expect(checkSubmission('rust', 'x', ['python'])).toMatch(/kan ikke løses/)
    expect(checkSubmission('python', 'x'.repeat(70_000), ['python'])).toMatch(/for lang/)
    expect(checkSubmission('c', 'int main(){}', ['c'])).toBeNull()
  })
  it('rate-limits per minute and per day', () => {
    const now = 1e9
    expect(rateLimited([], now)).toBeNull()
    expect(rateLimited(Array.from({ length: 10 }, (_, i) => now - i * 1000), now)).toMatch(/Vent et minut/)
    expect(rateLimited(Array.from({ length: 300 }, (_, i) => now - 120_000 - i * 60_000), now)).toMatch(/i morgen/)
  })
  it('talks to Judge0 over HTTP with base64 and polls until done', async () => {
    const calls: string[] = []
    let polls = 0
    const fetch = (async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method || 'GET'} ${url.split('?')[0]}`)
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body))
        expect(Buffer.from(body.submissions[0].source_code, 'base64').toString()).toBe('print(3)')
        expect((init.headers as Record<string, string>)['X-RapidAPI-Key']).toBe('k')
        return new Response(JSON.stringify([{ token: 't1' }]))
      }
      polls++
      const status = polls < 2 ? { id: 2 } : { id: 3 }
      return new Response(JSON.stringify({ submissions: [{ status, stdout: Buffer.from('3\n').toString('base64'), time: '0.01', memory: 100 }] }))
    }) as typeof globalThis.fetch
    const client = httpJudge0({ url: 'https://judge.test', headers: { 'X-RapidAPI-Key': 'k' }, fetch, sleep: async () => {}, b64: (s) => Buffer.from(s).toString('base64'), unb64: (s) => Buffer.from(s, 'base64').toString() })
    const r = await judge(client, 'python', 'print(3)', { public: [{ input: '', output: '3' }], hidden: [] }, limits)
    expect(r.verdict).toBe('AC')
    expect(calls).toEqual(['POST https://judge.test/submissions/batch', 'GET https://judge.test/submissions/batch', 'GET https://judge.test/submissions/batch'])
  })
})
