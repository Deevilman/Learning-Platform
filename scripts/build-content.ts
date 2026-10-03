// npm run content
// Validates content/courses/** and emits lazily-loadable JSON to public/data/.
// Any validation error fails the build with file:line. A course is either a
// folder (course.yaml, plan.md, videos.yaml, overrides.yaml, forward-refs.yaml)
// or one course file (<slug>.md with front matter, see CONTENT_GUIDE.md).

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import YAML from 'yaml'
import { buildCourse, type BuildEnv, type CourseSource, type CourseStats } from './lib/course-build.ts'
import { parseCoursePack } from './lib/course-pack.ts'
import type { ContentIndex, CourseMeta, ExerciseSummary, SearchDoc } from '../src/types/content.ts'

export interface BuildOptions {
  root: string // repo root (contains content/)
  out: string // output dir (public/data)
  quiet?: boolean
}

export interface BuildReport {
  ok: boolean
  errors: { file: string; line: number; message: string }[]
  warnings: string[]
  courses: CourseStats[]
  forwardRefsRemoved?: number
}

/** Interactive components and their meta (title, course, "Prøv selv" intro). */
export function readInteractives(contentDir: string): Pick<BuildEnv, 'interactives' | 'interactiveMeta'> {
  const dir = join(contentDir, 'interactives')
  const interactives = new Set(existsSync(dir) ? readdirSync(dir).filter((f) => /\.(tsx|ts)$/.test(f) && !f.startsWith('_')).map((f) => f.replace(/\.(tsx|ts)$/, '')) : [])
  const interactiveMeta = new Map<string, { title: string; intro?: string; course?: string }>()
  for (const id of interactives) {
    const src = readFileSync(join(dir, `${id}.tsx`), 'utf8')
    const meta = /export const meta = \{([^}]*)\}/.exec(src)?.[1] || ''
    const get = (k: string) => new RegExp(`${k}:\\s*'((?:\\\\'|[^'])*)'`).exec(meta)?.[1]?.replace(/\\'/g, "'")
    interactiveMeta.set(id, { title: get('title') || id, intro: get('intro'), course: get('course') })
  }
  return { interactives, interactiveMeta }
}

/** Read a course folder into a CourseSource. */
function readFolder(root: string, dir: string, slug: string): CourseSource {
  const rel = (f: string) => relative(root, join(dir, f))
  const yaml = (f: string) => (existsSync(join(dir, f)) ? YAML.parse(readFileSync(join(dir, f), 'utf8')) || {} : {})
  const extraDir = join(dir, 'extra-exercises')
  return {
    slug,
    meta: yaml('course.yaml'),
    plan: existsSync(join(dir, 'plan.md')) ? readFileSync(join(dir, 'plan.md'), 'utf8') : '',
    extras: existsSync(extraDir) ? readdirSync(extraDir).filter((x) => x.endsWith('.md')).sort().map((f) => ({ file: rel(`extra-exercises/${f}`), md: readFileSync(join(extraDir, f), 'utf8') })) : [],
    overrides: yaml('overrides.yaml'),
    videos: yaml('videos.yaml').videos || {},
    forwardRefs: yaml('forward-refs.yaml').exercises || {},
    files: { meta: rel('course.yaml'), plan: rel('plan.md'), overrides: rel('overrides.yaml'), videos: rel('videos.yaml'), forwardRefs: rel('forward-refs.yaml') },
  }
}

export function buildContent(opts: BuildOptions): BuildReport {
  const report: BuildReport = { ok: true, errors: [], warnings: [], courses: [] }
  const contentDir = join(opts.root, 'content')
  const coursesDir = join(contentDir, 'courses')
  const env: BuildEnv = readInteractives(contentDir)
  const { interactiveMeta } = env
  const allInteractives: ContentIndex['interactives'] = []
  const metas: CourseMeta[] = []
  const allSummaries: ExerciseSummary[] = []
  const search: SearchDoc[] = []
  const outputs: { path: string; data: unknown }[] = []

  // course folders and single course files
  const sources: CourseSource[] = []
  for (const d of readdirSync(coursesDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (d.isDirectory() && existsSync(join(coursesDir, d.name, 'course.yaml'))) sources.push(readFolder(opts.root, join(coursesDir, d.name), d.name))
    else if (d.isFile() && d.name.endsWith('.md') && !d.name.startsWith('_') && d.name !== 'README.md') {
      const file = relative(opts.root, join(coursesDir, d.name))
      const pack = parseCoursePack(readFileSync(join(coursesDir, d.name), 'utf8'), file)
      for (const e of pack.errors) report.errors.push(e)
      if (pack.source) {
        if (pack.source.slug !== d.name.replace(/\.md$/, '')) report.errors.push({ file, line: 1, message: `slug "${pack.source.slug}" matcher ikke filnavnet "${d.name}"` })
        sources.push(pack.source)
      }
    }
  }
  const seen = new Set<string>()
  for (const src of sources) {
    if (seen.has(src.slug)) report.errors.push({ file: src.files.meta, line: 0, message: `kurset "${src.slug}" findes to gange (mappe og kursusfil?)` })
    seen.add(src.slug)
    const b = buildCourse(src, env)
    report.errors.push(...b.errors)
    report.warnings.push(...b.warnings)
    if (b.forwardRefsRemoved) report.forwardRefsRemoved = (report.forwardRefsRemoved || 0) + b.forwardRefsRemoved
    for (const w of b.weeks) outputs.push({ path: `courses/${src.slug}/week-${w.number}.json`, data: w })
    for (const s of b.sets) outputs.push({ path: `courses/${src.slug}/set-${s.slug}.json`, data: s })
    outputs.push({ path: `courses/${src.slug}.json`, data: b.course })
    metas.push(b.meta)
    allSummaries.push(...b.summaries)
    search.push(...b.search)
    report.courses.push(b.stats)
  }


  // ---------- course graph
  const known = new Set(metas.map((m) => m.slug))
  for (const m of metas) {
    for (const p of m.prerequisites) if (!known.has(p)) report.errors.push({ file: `content/courses/${m.slug}/course.yaml`, line: 0, message: `forudsætningen "${p}" er ikke et kursus` })
    for (const n of m.next) if (!known.has(n)) report.warnings.push(`${m.slug}: "next: ${n}" findes ikke endnu (vises som "kommer senere")`)
  }

  report.ok = report.errors.length === 0
  if (report.ok) {
    if (existsSync(opts.out)) rmSync(opts.out, { recursive: true, force: true })
    for (const o of outputs) {
      const p = join(opts.out, o.path)
      mkdirSync(join(p, '..'), { recursive: true })
      writeFileSync(p, JSON.stringify(o.data))
    }
    for (const [id, m] of interactiveMeta) allInteractives.push({ id, title: m.title, intro: m.intro, course: m.course })
    const index: ContentIndex = { generatedAt: new Date().toISOString(), courses: metas, exercises: allSummaries, interactives: allInteractives }
    writeFileSync(join(opts.out, 'index.json'), JSON.stringify(index))
    writeFileSync(join(opts.out, 'search.json'), JSON.stringify(search))
  }
  return report
}

/** For GitHub: a Markdown list of the errors, posted as an issue by the deploy workflow. */
function writeErrorReport(root: string, report: BuildReport) {
  const repo = process.env.GITHUB_REPOSITORY
  const sha = process.env.GITHUB_SHA
  const link = (f: string, l: number) => (repo && sha ? `[${f}${l ? `:${l}` : ''}](https://github.com/${repo}/blob/${sha}/${f}${l ? `#L${l}` : ''})` : `${f}${l ? `:${l}` : ''}`)
  const byFile = new Map<string, BuildReport['errors']>()
  for (const e of report.errors) byFile.set(e.file, [...(byFile.get(e.file) || []), e])
  const lines = [
    'Et kursus kunne ikke bygges, så siden er ikke opdateret. Ret fejlene herunder (linjenumrene peger ind i filen), og upload filen igen.',
    '',
    ...[...byFile].flatMap(([f, es]) => [`### ${f}`, '', ...es.slice(0, 100).map((e) => `- ${link(e.file, e.line)}: ${e.message}`), ...(es.length > 100 ? [`- … og ${es.length - 100} mere`] : []), '']),
  ]
  writeFileSync(join(root, 'content-build-errors.md'), lines.join('\n'))
}

function main() {
  const root = join(import.meta.dirname, '..')
  const t0 = Date.now()
  const report = buildContent({ root, out: join(root, 'public/data') })
  for (const w of report.warnings) console.warn(`  ! ${w}`)
  if (!report.ok) {
    for (const e of report.errors) console.error(`✗ ${e.file}${e.line ? `:${e.line}` : ''}: ${e.message}`)
    console.error(`\n${report.errors.length} fejl — indholdet blev ikke bygget.`)
    writeErrorReport(root, report)
    process.exit(1)
  }
  console.log('Kursus        Uger  Øvelser  Løsninger  Videoer (mangler ID)  Selvtest  Interview')
  for (const c of report.courses)
    console.log(
      `${c.slug.padEnd(13)} ${String(c.weeks).padStart(4)}  ${String(c.exercises).padStart(7)}  ${String(c.solutions).padStart(9)}  ${String(c.videos).padStart(7)} (${c.videosMissing})`.padEnd(58) +
        `${String(c.selftest).padStart(8)}  ${String(c.interview).padStart(9)}`,
    )
  console.log(`✓ Indhold bygget til public/data på ${((Date.now() - t0) / 1000).toFixed(1)} s`)
}

if (process.argv[1] && basename(process.argv[1]) === 'build-content.ts') main()
