import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseCoursePack } from '../../scripts/lib/course-pack'
import { buildCourse } from '../../scripts/lib/course-build'
import { readInteractives } from '../../scripts/build-content'

const ROOT = join(import.meta.dirname, '../..')
const fixture = readFileSync(join(ROOT, 'tests/fixtures/testkursus.md'), 'utf8')
const env = { ...readInteractives(join(ROOT, 'content')), sanitize: true }

describe('course file (kursuspakke)', () => {
  it('parses front matter, plan and special blocks, keeping line numbers', () => {
    const pack = parseCoursePack(fixture, 'testkursus.md')
    expect(pack.errors).toEqual([])
    expect(pack.source!.slug).toBe('testkursus')
    expect(pack.blocks.map((b) => b.kind)).toEqual(['lesson', 'opgaveskabelon', 'lesson'])
    expect(pack.blocks[0].data.video).toBe('T1')
    // the plan keeps the file's line numbers: "## Uge 1" is on the same line in both
    const fileLine = fixture.split('\n').findIndex((l) => l.startsWith('## Uge 1')) + 1
    expect(pack.source!.plan.split('\n')[fileLine - 1]).toMatch(/^## Uge 1/)
    expect(pack.source!.plan).not.toContain('```lesson')
  })

  it('builds the whole course from the one file', () => {
    const pack = parseCoursePack(fixture, 'testkursus.md')
    const b = buildCourse(pack.source!, env)
    expect(b.errors).toEqual([])
    expect(b.stats).toMatchObject({ weeks: 2, exercises: 4, solutions: 4, videos: 2, videosMissing: 0 })
    expect(b.meta).toMatchObject({ lang: 'da', track: 'matematik', prerequisites: [], recommendedBefore: [] })
    expect(b.weeks[0].videos[0].sources[0].youtube).toBe('EXUxMOM03Bo')
    expect(b.weeks[0].exercises[0].quiz?.choices?.options).toHaveLength(3)
    expect(b.course.glossary.map((g) => g.en)).toEqual(['proposition', 'quantifier'])
    expect(b.weeks[0].exercises[0].prompt).toContain('class="subq"')
  })

  it('turns lesson blocks into lesson pages and makes drafts from Fokus/Pause og tænk', () => {
    const b = buildCourse(parseCoursePack(fixture, 'testkursus.md').source!, env)
    const l = b.weeks[0].videos[0].lesson!
    expect(l.draft).toBeUndefined()
    expect(l.goals).toHaveLength(2)
    expect(l.summary).toContain('enten er sand eller falsk')
    expect(l.questions).toHaveLength(2)
    expect(l.questions[0].options!.map((o) => o.replace(/<[^>]+>/g, '')).sort()).toEqual(['Ja', 'Nej'])
    expect(l.questions[0].options![l.questions[0].correct!]).toContain('Nej')

    const quant = parseCoursePack(readFileSync(join(ROOT, 'content/courses/quant.md'), 'utf8'), 'quant.md')
    const q = buildCourse(quant.source!, env)
    const v = q.weeks[0].videos[0]
    expect(v.lesson).toMatchObject({ draft: true })
    expect(v.lesson!.goals[0]).toBe(v.focus)
    expect(v.lesson!.questions[0].prompt).toBe(v.pause)
    expect(v.lesson!.summary).toBeUndefined() // nothing invented

    const line = fixture.split('\n').indexOf('video: T2')
    const wrong = buildCourse(parseCoursePack(fixture.replace('video: T2', 'video: T9').replace('    svar: Nej\n    muligheder: [Nej, Ja]\n```', '    svar: Måske\n    muligheder: [Nej, Ja]\n```'), 'x.md').source!, env)
    expect(wrong.errors.map((e) => [e.line, e.message.slice(0, 40)])).toEqual(expect.arrayContaining([[line, expect.stringMatching(/Lektionen er til videoen "T9"/)]]))
  })

  it('runs exercise templates through 200 seeds and reports the block line', () => {
    const b = buildCourse(parseCoursePack(fixture, 'testkursus.md').source!, env)
    expect(b.course.templates?.map((t) => [t.id, t.kursus])).toEqual([['testkursus/addition', 'testkursus']])
    const line = fixture.split('\n').indexOf('```opgaveskabelon') + 1
    const broken = fixture.replace('loesning: "${a} + {b} = {s}$"', 'loesning: "Læg sammen."').replace('emner: [udsagn]', 'emner: [algebra]')
    const bb = buildCourse(parseCoursePack(broken, 'x.md').source!, env)
    expect(bb.errors.map((e) => e.line)).toEqual([line])
    expect(bb.errors[0].message).toMatch(/Opgaveskabelonen "testkursus\/addition": Seed \d+: løsningen nævner ikke svaret/)
    const topicOnly = buildCourse(parseCoursePack(fixture.replace('emner: [udsagn]', 'emner: [algebra]'), 'x.md').source!, env)
    expect(topicOnly.errors[0].message).toMatch(/emnet "algebra" står ikke under "topics"/)
  })

  it('explains mistakes in plain Danish with line numbers', () => {
    const broken = fixture.replace('slug: testkursus', 'slug: Test Kursus').replace('lang: da', 'lang: sv').replace('color: "#0ea5e9"', 'color: blå')
    const pack = parseCoursePack(broken, 'x.md')
    const msgs = pack.errors.map((e) => `${e.line}: ${e.message}`)
    expect(msgs.some((m) => /^2: "slug" må kun/.test(m))).toBe(true)
    expect(msgs.some((m) => /^3: "lang" skal være/.test(m))).toBe(true)
    expect(msgs.some((m) => /"color"/.test(m))).toBe(true)
    expect(parseCoursePack('# ingen front matter', 'y.md').errors[0].message).toMatch(/starte med "---"/)
    const badYaml = parseCoursePack('---\ntitle: [uafsluttet\n---\n# x', 'z.md')
    expect(badYaml.errors[0]).toMatchObject({ line: 2 })
    const unclosed = parseCoursePack(fixture.replace(/```\n\n### 🧠 Kernebegreber\n\n\*\*Udsagn/, '\n\n### 🧠 Kernebegreber\n\n**Udsagn'), 'u.md')
    expect(unclosed.errors.length).toBeGreaterThan(0) // the block runs into the next one and cannot be read
  })

  it('reports plan errors at the line in the uploaded file', () => {
    const broken = fixture.replace('**1.2** ★★ — Hvad er', '**3.2** ★★ — Hvad er')
    const pack = parseCoursePack(broken, 'testkursus.md')
    const b = buildCourse(pack.source!, env)
    const line = broken.split('\n').findIndex((l) => l.startsWith('**3.2**')) + 1
    expect(b.errors.some((e) => e.line === line)).toBe(true)
  })

  it('accepts videos for paying supporters and rejects bad IDs', () => {
    const steady = fixture.replace('{ key: T2, youtube: O4ndIDcDSGc,', '{ key: T2, access: steady, url: "https://example.com/kursus",')
    const b = buildCourse(parseCoursePack(steady, 't.md').source!, env)
    const src = b.weeks[1].videos[0].sources[0]
    expect(src).toMatchObject({ access: 'steady', url: 'https://example.com/kursus' })
    expect(src.youtube).toBeUndefined()
    const bad = parseCoursePack(fixture.replace('youtube: EXUxMOM03Bo', 'youtube: kort'), 't.md')
    expect(bad.errors.some((e) => /YouTube-ID/.test(e.message))).toBe(true)
  })

  it('removes unsafe HTML from uploaded courses but keeps the platform’s own parts', () => {
    const evil = fixture.replace('**Negation.** $\\neg p$', '<script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">x</a>\n\n::interactive{id="truth-table"}\n\n**Negation.** $\\neg p$')
    const b = buildCourse(parseCoursePack(evil, 't.md').source!, env)
    const notes = b.weeks[0].notes
    expect(notes).not.toMatch(/<script|onerror|javascript:/)
    expect(notes).toContain('data-interactive="truth-table"')
    expect(notes).toContain('class="katex')
  })
})

describe('JSON Schema for course files', () => {
  it('matches the validator and covers every front-matter field of the example', async () => {
    const schema = JSON.parse(readFileSync(join(ROOT, 'content/course-pack.schema.json'), 'utf8'))
    const { REQUIRED_FIELDS } = await import('../../scripts/lib/course-pack')
    expect(schema.required).toEqual([...REQUIRED_FIELDS])
    const YAML = (await import('yaml')).default
    const fm = YAML.parse(fixture.split('\n---\n')[0].replace(/^---\n/, ''))
    for (const k of Object.keys(fm)) expect(Object.keys(schema.properties), k).toContain(k)
  })
})

describe('a course in two languages (same slug, shared progress)', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, readFileSync: read, existsSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { buildContent } = await import('../../scripts/build-content')
  it('builds <slug>.en.md next to <slug>.md and lists both languages', () => {
    const root = mkdtempSync(join(tmpdir(), 'laering-'))
    mkdirSync(join(root, 'content/courses'), { recursive: true })
    symlinkSync(join(ROOT, 'content/interactives'), join(root, 'content/interactives'))
    writeFileSync(join(root, 'content/courses/testkursus.md'), fixture)
    const en = fixture.replace('lang: da', 'lang: en').replace('title: Testkursus i logik', 'title: Test course in logic').replace('## Uge 1 — Udsagn', '## Uge 1 — Propositions')
    writeFileSync(join(root, 'content/courses/testkursus.en.md'), en)
    const out = join(root, 'out')
    const r = buildContent({ root, out, quiet: true })
    expect(r.errors).toEqual([])
    const idx = JSON.parse(read(join(out, 'index.json'), 'utf8'))
    expect(idx.courses).toHaveLength(1)
    expect(idx.courses[0]).toMatchObject({ slug: 'testkursus', lang: 'da', langs: ['da', 'en'] })
    expect(JSON.parse(read(join(out, 'courses/testkursus.en.json'), 'utf8')).meta.title).toBe('Test course in logic')
    expect(JSON.parse(read(join(out, 'courses/testkursus.en/week-1.json'), 'utf8')).title).toBe('Propositions')
    expect(existsSync(join(out, 'courses/testkursus/week-1.json'))).toBe(true)
    // two files with the same language is an error
    writeFileSync(join(root, 'content/courses/testkursus.da.md'), fixture)
    expect(buildContent({ root, out, quiet: true }).errors.map((e) => e.message)).toEqual([expect.stringMatching(/findes to gange på dansk/)])
  })
})
