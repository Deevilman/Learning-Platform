// Acceptance test (M5): a new course with 1 week, 2 exercises, 1 video and
// 1 generator can be added ONLY by adding files, followed by `npm run content`.
// Runs against a copy of the repo's content/ and src/ so other tests are unaffected.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer, type ViteDevServer } from 'vite'
import { buildContent, type BuildReport } from '../../scripts/build-content'

const ROOT = join(import.meta.dirname, '../..')

const COURSE_YAML = `slug: testkursus
title: "Testkursus"
short: "Bevis for udvidelighed"
color: "#0891b2"
icon: test
level: "test"
estimated_weeks: 1
prerequisites: [foundations]
next: []
topics:
  - { id: test-topic, name: "Testemne", weeks: [1] }
expect: { weeks: 1, exercises: 2, solutions: 2 }
`

const PLAN = `# Testkursus

En lille plan i standardformatet.

## Uge 1 — Det hele på én uge

> **Læringsmål:** At bevise, at platformen kan udvides med filer alene.
> **Tidsforbrug:** 10 min
> **Forudsætninger:** Ingen.

### 📺 Se

- [ ] **T1.1** En testvideo (Testkanal)
  Fokus: at videoen bliver fundet i videos.yaml.

### 🧠 Kernebegreber

**Sætning.** $1 + 1 = 2$.

### ✏️ Øvelser

**1.1** ★ — Hvad er $1 + 1$?

**1.2** ★★ 🗣️ — Forklar hvorfor.

### ✅ Løsninger

<details>
<summary>Løsning 1.1</summary>

$2$.

</details>

<details>
<summary>Løsning 1.2</summary>

Fordi $S(0) + S(0) = S(S(0))$.

</details>

### 🏁 Checkpoint

- [ ] Jeg kan lægge 1 og 1 sammen.
`

const VIDEOS = `videos:
  T1.1:
    key: T1.1
    sources:
      - title: En testvideo
        channel: Testkanal
        youtube: dQw4w9WgXcQ
`

const GENERATOR = `import { defineGenerator } from '@/lib/generators'
export default defineGenerator({
  id: 'zz-test-gen',
  title: 'Testgenerator',
  course: 'testkursus',
  topics: ['test-topic'],
  difficulties: [1],
  make(rng) {
    const a = rng.int(1, 9)
    const b = rng.int(1, 9)
    return { prompt: \`Hvad er $\${a} + \${b}$?\`, solution: \`**\${a + b}**\`, check: { type: 'numeric', answer: a + b, tolerance: 0 } }
  },
})
`

describe('adding a course by adding files only', () => {
  let tmp: string
  let report: BuildReport
  let server: ViteDevServer | undefined

  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'lp-ext-'))
    cpSync(join(ROOT, 'content'), join(tmp, 'content'), { recursive: true, filter: (p) => !p.includes(`${join('content', 'source')}`) })
    cpSync(join(ROOT, 'src'), join(tmp, 'src'), { recursive: true })
    // The only change: new files.
    mkdirSync(join(tmp, 'content/courses/testkursus'), { recursive: true })
    writeFileSync(join(tmp, 'content/courses/testkursus/course.yaml'), COURSE_YAML)
    writeFileSync(join(tmp, 'content/courses/testkursus/plan.md'), PLAN)
    writeFileSync(join(tmp, 'content/courses/testkursus/videos.yaml'), VIDEOS)
    writeFileSync(join(tmp, 'content/generators/zz-test-gen.ts'), GENERATOR)
    report = buildContent({ root: tmp, out: join(tmp, 'public/data') })
  }, 120000)

  afterAll(async () => {
    await server?.close()
    rmSync(tmp, { recursive: true, force: true })
  })

  it('the content build picks up the new course with the right counts', () => {
    expect(report.errors).toEqual([])
    const c = report.courses.find((x) => x.slug === 'testkursus')
    expect(c).toMatchObject({ weeks: 1, exercises: 2, solutions: 2, videos: 1, videosMissing: 0 })
    const idx = JSON.parse(readFileSync(join(tmp, 'public/data/index.json'), 'utf8'))
    expect(idx.courses.map((m: { slug: string }) => m.slug)).toContain('testkursus')
    const week = JSON.parse(readFileSync(join(tmp, 'public/data/courses/testkursus/week-1.json'), 'utf8'))
    expect(week.videos[0].sources[0].youtube).toBe('dQw4w9WgXcQ')
    expect(week.exercises.map((e: { kind: string }) => e.kind)).toEqual(['compute', 'explain'])
  })

  it('the generator registry picks up the new generator', async () => {
    server = await createServer({
      root: tmp,
      configFile: false,
      logLevel: 'silent',
      server: { middlewareMode: true, hmr: false },
      resolve: { alias: { '@': join(tmp, 'src') } },
      optimizeDeps: { noDiscovery: true, include: [] },
    })
    const mod = await server.ssrLoadModule('/src/lib/generators.ts')
    const g = mod.generators.find((x: { id: string }) => x.id === 'zz-test-gen')
    expect(g).toBeDefined()
    const ex = g.generate(123, 1)
    expect(ex.check.type).toBe('numeric')
    expect(ex.solution).toContain(String(ex.check.answer))
  }, 60000)
})
