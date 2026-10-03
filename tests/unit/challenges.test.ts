import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkFlag, flagRateLimited, hashFlag, labFlag } from '../../supabase/functions/flag/logic'
import { parseCoursePack } from '../../scripts/lib/course-pack'
import { buildCourse } from '../../scripts/lib/course-build'
import { readInteractives } from '../../scripts/build-content'
import { findSecrets } from '../../scripts/lib/bundle-secrets'

const ROOT = join(import.meta.dirname, '../..')
const ctf = readFileSync(join(ROOT, 'tests/fixtures/ctf-testkursus.md'), 'utf8')
const env = { ...readInteractives(join(ROOT, 'content')), sanitize: true }

describe('flags', () => {
  it('only a salted hash is stored, and the check is server logic', async () => {
    const h = await hashFlag('FLAG{x}', 'aabbccddeeff0011')
    expect(h).toMatch(/^sha256:aabbccddeeff0011:[0-9a-f]{64}$/)
    expect(h).not.toContain('FLAG')
    expect(await checkFlag(' FLAG{x} ', h)).toBe(true)
    expect(await checkFlag('FLAG{y}', h)).toBe(false)
    expect(await checkFlag('FLAG{x}', 'FLAG{x}')).toBe(false) // a plain flag is never accepted as a hash
  })
  it('lab flags are unique per learner', async () => {
    const a = await labFlag('s3cret', 'user-a', 'lab/1')
    expect(a).toMatch(/^FLAG\{[0-9a-f]{24}\}$/)
    expect(await labFlag('s3cret', 'user-b', 'lab/1')).not.toBe(a)
    expect(await labFlag('s3cret', 'user-a', 'lab/1')).toBe(a)
  })
  it('rate-limits guesses', () => {
    expect(flagRateLimited([1, 2, 3, 4, 5].map((s) => 1e9 - s * 1000), 1e9)).toMatch(/Vent et minut/)
    expect(flagRateLimited([], 1e9)).toBeNull()
  })
})

describe('the security test course', () => {
  const b = buildCourse(parseCoursePack(ctf, 'ctf-testkursus.md').source!, env)
  it('has one none, one files and one browser-sandbox challenge', () => {
    expect(b.errors).toEqual([])
    expect(b.course.challenges!.map((c) => c.env)).toEqual(['none', 'files', 'browser-sandbox'])
    expect(b.course.challenges![1].files![0].name).toBe('noter.txt')
  })
  it('sends no flag hash or write-up to the app', () => {
    const json = JSON.stringify(b)
    const app = JSON.stringify({ course: b.course, weeks: b.weeks, search: b.search })
    for (const s of b.serverChallenges) {
      expect(app).not.toContain(s.flagHash!.split(':')[2])
      expect(app).not.toContain(s.writeup.slice(0, 40))
    }
    expect(json).toContain('serverChallenges')
  })
  it('rejects a plain-text flag in the file', () => {
    const bad = buildCourse(parseCoursePack(ctf.replace(/flag_hash: sha256:\S+/, 'flag_hash: FLAG{oops}'), 'x.md').source!, env)
    expect(bad.errors.map((e) => e.message).join('\n')).toMatch(/ligner et flag i klar tekst/)
  })
  it('the bundle check finds a flag, hash, write-up or hidden test — and passes when there is none', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dist-'))
    mkdirSync(join(dir, 'assets'))
    writeFileSync(join(dir, 'assets', 'app.js'), 'console.log("hello")')
    const problems = [{ id: 'p', course: 'c', languages: ['python' as const], timeLimit: 1, memoryLimit: 64, publicTests: [], hiddenTests: [{ input: '123456789 987654321', output: '1' }], reference: { language: 'python' as const, code: 'print(sum(map(int, input().split())))' } }]
    expect(await findSecrets(dir, b.serverChallenges, problems)).toEqual([])
    writeFileSync(join(dir, 'assets', 'leak.js'), `const f = "FLAG{brute-force-fra-en-adresse}"; const t = "123456789 987654321"`)
    const found = await findSecrets(dir, b.serverChallenges, problems)
    expect(found).toEqual(expect.arrayContaining([expect.stringMatching(/flaget til ctf-testkursus\/loggen/), expect.stringMatching(/skjult test i p/)]))
  })
})
