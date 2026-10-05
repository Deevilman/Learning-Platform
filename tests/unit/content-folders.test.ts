// Coding problems and challenges kept as folders next to the course file.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { buildContent, type BuildReport } from '../../scripts/build-content'

const ROOT = join(import.meta.dirname, '../..')
const HASH = 'sha256:b0d5b7388d45ebdb:d985b171c2c66adef02498120f7ad62b1aecc87382e060138dde9a0383dcb429'

function root(files: Record<string, string>) {
  const tmp = mkdtempSync(join(tmpdir(), 'folders-'))
  mkdirSync(join(tmp, 'content/courses'), { recursive: true })
  cpSync(join(ROOT, 'tests/fixtures/testkursus.md'), join(tmp, 'content/courses/testkursus.md'))
  cpSync(join(ROOT, 'content/interactives'), join(tmp, 'content/interactives'), { recursive: true })
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(tmp, path)), { recursive: true })
    writeFileSync(join(tmp, path), body)
  }
  return tmp
}

const P = 'content/problems/testkursus/dobbelt'
const C = 'content/challenges/testkursus/logfil'
const GOOD = {
  [`${P}/meta.yaml`]: 'titel: Dobbelt op\nsvaerhed: 1\nemner: [udsagn]\nsprog: [python, c]\nuge: 1\nhints: ["Gang med 2."]\n',
  [`${P}/opgave.md`]: 'Læs et heltal $n$, og udskriv $2n$.\n',
  [`${P}/loesning.md`]: 'Læs tallet, og gang det med 2.\n',
  [`${P}/reference.py`]: 'print(2 * int(input()))\n',
  [`${P}/start.py`]: 'n = int(input())\n',
  [`${P}/tests/offentlig/1.in`]: '3\n',
  [`${P}/tests/offentlig/1.out`]: '6\n',
  [`${P}/tests/skjult/1.in`]: '-4\n',
  [`${P}/tests/skjult/1.out`]: '-8\n',
  [`${P}/tests/skjult/2.in`]: '0\n',
  [`${P}/tests/skjult/2.out`]: '0\n',
  [`${C}/meta.yaml`]: `titel: Find spor i loggen\nmiljoe: files\nsvaerhed: 1\nemner: [udsagn]\nhints: ["Søg efter FLAG."]\nflag_hash: ${HASH}\n`,
  [`${C}/opgave.md`]: 'Hent loggen, og find flaget.\n',
  [`${C}/writeup.md`]: 'Flaget står i linje 2.\n',
  [`${C}/filer/log.txt`]: 'ok\nok\n',
}

describe('problems and challenges as folders', () => {
  let tmp = ''
  let report: BuildReport
  beforeAll(() => {
    tmp = root(GOOD)
    report = buildContent({ root: tmp, out: join(tmp, 'public/data') })
  }, 120000)
  afterAll(() => rmSync(tmp, { recursive: true, force: true }))

  it('builds a problem folder like a block: examples to the app, hidden tests only to the judge', () => {
    expect(report.errors).toEqual([])
    const course = JSON.parse(readFileSync(join(tmp, 'public/data/courses/testkursus.json'), 'utf8'))
    const p = course.problems.find((x: { id: string }) => x.id === 'testkursus/dobbelt')
    expect(p).toMatchObject({ title: 'Dobbelt op', languages: ['python', 'c'], week: 1, hiddenCount: 2, publicTests: [{ input: '3\n', output: '6\n' }], starter: { python: 'n = int(input())\n' } })
    expect(JSON.stringify(course)).not.toContain('-8')
    const server = JSON.parse(readFileSync(join(tmp, '.judge/problems.json'), 'utf8')).find((x: { id: string }) => x.id === 'testkursus/dobbelt')
    expect(server.hiddenTests).toEqual([{ input: '-4\n', output: '-8\n' }, { input: '0\n', output: '0\n' }])
    expect(server.reference).toEqual({ language: 'python', code: 'print(2 * int(input()))\n' })
  })

  it('builds a challenge folder with its files; the write-up stays on the server', () => {
    const course = JSON.parse(readFileSync(join(tmp, 'public/data/courses/testkursus.json'), 'utf8'))
    const c = course.challenges.find((x: { id: string }) => x.id === 'testkursus/logfil')
    expect(c).toMatchObject({ env: 'files', files: [{ name: 'log.txt', content: 'ok\nok\n' }] })
    expect(JSON.stringify(course)).not.toContain('linje 2')
    const server = JSON.parse(readFileSync(join(tmp, '.judge/challenges.json'), 'utf8')).find((x: { id: string }) => x.id === 'testkursus/logfil')
    expect(server).toMatchObject({ flagHash: HASH, writeup: 'Flaget står i linje 2.\n' })
  })

  it('reports a wrong reference, a missing .out, an unknown course and fields that belong in files', () => {
    const bad = root({
      ...GOOD,
      [`${P}/reference.py`]: 'print(3 * int(input()))\n',
      [`${P}/tests/skjult/3.in`]: '1\n',
      'content/problems/findes-ikke/x/meta.yaml': 'titel: X\n',
      [`${C}/meta.yaml`]: `titel: Find spor\nmiljoe: files\nsvaerhed: 1\nemner: [udsagn]\nhints: [h]\nflag_hash: ${HASH}\nwriteup: hemmeligt\n`,
    })
    try {
      const r = buildContent({ root: bad, out: join(bad, 'public/data') })
      const msgs = r.errors.map((e) => `${e.file}: ${e.message}`).join('\n')
      expect(msgs).toContain(`${P}: kodeopgaven "testkursus/dobbelt"`)
      expect(msgs).toContain('tests/skjult/3.in mangler sin .out-fil')
      expect(msgs).toContain('kurset "findes-ikke" findes ikke')
      expect(msgs).toContain('"writeup" hører ikke til i meta.yaml')
    } finally {
      rmSync(bad, { recursive: true, force: true })
    }
  }, 120000)
})
