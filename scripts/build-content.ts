// npm run content
// Validates content/courses/** and emits lazily-loadable JSON to public/data/.
// Any validation error fails the build with file:line.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import YAML from 'yaml'
import { parsePlan, parseGlossary, type RawPlan, type RawWeek, type RawQA } from './lib/plan-parser.ts'
import { renderMarkdown, renderInline, plainText, type RenderContext } from './lib/markdown.ts'
import type {
  AutoCheck,
  ContentIndex,
  CourseData,
  CourseMeta,
  Difficulty,
  Exercise,
  ExerciseKind,
  ExerciseSet,
  ExerciseSummary,
  GlossaryEntry,
  InfoPage,
  Project,
  SearchDoc,
  VideoItem,
  Week,
} from '../src/types/content.ts'

export interface BuildOptions {
  root: string // repo root (contains content/)
  out: string // output dir (public/data)
  quiet?: boolean
}

export interface BuildReport {
  ok: boolean
  errors: { file: string; line: number; message: string }[]
  warnings: string[]
  courses: { slug: string; weeks: number; exercises: number; solutions: number; videos: number; videosMissing: number; selftest: number; interview: number }[]
}

interface Overrides {
  exercises?: Record<string, { topics?: string[]; add_topics?: string[]; difficulty?: Difficulty; kind?: ExerciseKind; check?: AutoCheck }>
  inserts?: { week: number; section?: 'notes' | 'connection' | 'exercises' | 'videos'; after?: string; markdown: string }[]
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const PROOF_RE = /\b(vis|bevis|bevís|godtgør|udled|argumentér|argumenter|show|prove)\b/i

function classify(markers: string[], prompt: string): ExerciseKind {
  if (markers.includes('💻')) return 'code'
  if (markers.includes('🗣️')) return 'explain'
  return PROOF_RE.test(prompt) ? 'proof' : 'compute'
}

function validateCheck(c: any): string | null {
  if (!c || typeof c !== 'object') return 'check skal være et objekt'
  switch (c.type) {
    case 'numeric':
      return typeof c.answer === 'number' && isFinite(c.answer) ? null : 'numeric: "answer" skal være et tal'
    case 'numeric-list':
      return Array.isArray(c.answers) && c.answers.every((x: any) => typeof x === 'number') ? null : 'numeric-list: "answers" skal være en liste af tal'
    case 'choice':
      return Array.isArray(c.options) && Number.isInteger(c.correct) && c.correct >= 0 && c.correct < c.options.length ? null : 'choice: "options" og et gyldigt "correct"-indeks kræves'
    case 'text':
      return Array.isArray(c.answers) && c.answers.length ? null : 'text: "answers" skal være en ikke-tom liste'
    case 'output':
      return typeof c.expected === 'string' ? null : 'output: "expected" skal være en streng'
    default:
      return `ukendt check-type "${c.type}"`
  }
}

function applyInserts(md: string, inserts: Overrides['inserts'], week: number, section: string, file: string, errors: BuildReport['errors']): string {
  if (!inserts) return md
  let out = md
  for (const ins of inserts.filter((i) => i.week === week && (i.section || 'notes') === section)) {
    if (!ins.after) {
      out = `${out}\n\n${ins.markdown.trim()}\n`
      continue
    }
    const lines = out.split('\n')
    const idx = lines.findIndex((l) => l.includes(ins.after!))
    if (idx < 0) {
      errors.push({ file, line: 0, message: `insert i uge ${week} (${section}): teksten "${ins.after}" blev ikke fundet` })
      continue
    }
    // Insert after the paragraph / block that contains the match.
    let end = idx
    while (end + 1 < lines.length && lines[end + 1].trim() !== '') end++
    lines.splice(end + 1, 0, '', ins.markdown.trim(), '')
    out = lines.join('\n')
  }
  return out
}

export function buildContent(opts: BuildOptions): BuildReport {
  const report: BuildReport = { ok: true, errors: [], warnings: [], courses: [] }
  const contentDir = join(opts.root, 'content')
  const coursesDir = join(contentDir, 'courses')
  const interactives = new Set(
    existsSync(join(contentDir, 'interactives'))
      ? readdirSync(join(contentDir, 'interactives'))
          .filter((f) => /\.(tsx|ts)$/.test(f) && !f.startsWith('_'))
          .map((f) => f.replace(/\.(tsx|ts)$/, ''))
      : [],
  )

  const metas: CourseMeta[] = []
  const allSummaries: ExerciseSummary[] = []
  const search: SearchDoc[] = []
  const outputs: { path: string; data: unknown }[] = []

  const slugs = readdirSync(coursesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(coursesDir, d.name, 'course.yaml')))
    .map((d) => d.name)
    .sort()

  for (const slug of slugs) {
    const dir = join(coursesDir, slug)
    const rel = (f: string) => relative(opts.root, join(dir, f))
    const err = (file: string, line: number, message: string) => report.errors.push({ file, line, message })

    // ---------- course.yaml
    const metaRaw = YAML.parse(readFileSync(join(dir, 'course.yaml'), 'utf8')) || {}
    for (const f of ['slug', 'title', 'short', 'topics']) if (metaRaw[f] === undefined) err(rel('course.yaml'), 0, `mangler feltet "${f}"`)
    if (metaRaw.slug && metaRaw.slug !== slug) err(rel('course.yaml'), 0, `slug "${metaRaw.slug}" matcher ikke mappenavnet "${slug}"`)
    const meta: CourseMeta = {
      slug,
      title: metaRaw.title || slug,
      short: metaRaw.short || '',
      color: metaRaw.color || '#64748b',
      icon: metaRaw.icon || 'book',
      level: metaRaw.level || '',
      estimated_weeks: metaRaw.estimated_weeks || 0,
      prerequisites: metaRaw.prerequisites || [],
      next: metaRaw.next || [],
      topics: (metaRaw.topics || []).map((t: any) => ({ id: String(t.id), name: String(t.name), weeks: (t.weeks || []).map(Number) })),
      disclaimer: metaRaw.disclaimer,
    }
    const topicIds = new Set(meta.topics.map((t) => t.id))
    const weekTopics = (w: number) => meta.topics.filter((t) => t.weeks.includes(w)).map((t) => t.id)

    // ---------- plan.md (+ extra exercises)
    if (!existsSync(join(dir, 'plan.md'))) {
      err(rel('plan.md'), 0, 'plan.md mangler')
      continue
    }
    const planFile = rel('plan.md')
    const plan: RawPlan = parsePlan(readFileSync(join(dir, 'plan.md'), 'utf8'))
    for (const e of plan.errors) err(planFile, e.line, e.message)

    const extraDir = join(dir, 'extra-exercises')
    const extras: { file: string; weeks: RawWeek[] }[] = []
    if (existsSync(extraDir)) {
      for (const f of readdirSync(extraDir).filter((x) => x.endsWith('.md')).sort()) {
        const p = parsePlan(readFileSync(join(extraDir, f), 'utf8'), { extra: true })
        for (const e of p.errors) err(rel(`extra-exercises/${f}`), e.line, e.message)
        extras.push({ file: rel(`extra-exercises/${f}`), weeks: p.weeks })
      }
    }

    // ---------- overrides.yaml
    const overrides: Overrides = existsSync(join(dir, 'overrides.yaml')) ? YAML.parse(readFileSync(join(dir, 'overrides.yaml'), 'utf8')) || {} : {}
    const ovFile = rel('overrides.yaml')
    const allNumbers = new Set<string>()
    for (const w of plan.weeks) for (const e of w.exercises) allNumbers.add(e.number)
    for (const x of extras) for (const w of x.weeks) for (const e of w.exercises) {
      if (allNumbers.has(e.number)) err(x.file, e.line, `øvelse ${e.number} findes allerede`)
      allNumbers.add(e.number)
    }
    for (const [num, ov] of Object.entries(overrides.exercises || {})) {
      const isSet = /^(selftest|interview)\/\d+$/.test(num)
      if (!allNumbers.has(num) && !isSet) err(ovFile, 0, `override for ukendt øvelse "${num}"`)
      for (const t of [...(ov.topics || []), ...(ov.add_topics || [])]) if (!topicIds.has(t)) err(ovFile, 0, `øvelse ${num}: ukendt emne "${t}"`)
      if (ov.check) {
        const msg = validateCheck(ov.check)
        if (msg) err(ovFile, 0, `øvelse ${num}: ${msg}`)
      }
    }

    // ---------- videos.yaml
    const videosFile = existsSync(join(dir, 'videos.yaml')) ? YAML.parse(readFileSync(join(dir, 'videos.yaml'), 'utf8')) || {} : {}
    const videoMap: Record<string, { sources: any[] }> = videosFile.videos || {}
    const usedVideoKeys = new Set<string>()

    const ctx = (file: string, line: number): RenderContext => ({ file, line, interactives, errors: report.errors, directives: [] })
    const md = (s: string | undefined, file: string, line: number) => (s ? renderMarkdown(s, ctx(file, line)) : '')
    const inl = (s: string | undefined, file: string, line: number) => (s ? renderInline(s, ctx(file, line)) : '')

    const makeExercise = (w: RawWeek, e: RawWeek['exercises'][number], sol: RawWeek['solutions'][number] | undefined, file: string, set: ExerciseSummary['set']): Exercise => {
      const ov = overrides.exercises?.[e.number] || {}
      const topics = ov.topics || [...new Set([...weekTopics(w.number), ...(ov.add_topics || [])])]
      const kind = ov.kind || classify(e.markers, e.prompt)
      return {
        id: `${slug}/${w.number}/${e.number}`,
        course: slug,
        week: w.number,
        number: e.number,
        topics,
        difficulty: (ov.difficulty || e.stars) as Difficulty,
        kind,
        hasHint: !!sol?.hint,
        hasCheck: !!ov.check,
        set,
        title: plainText(e.prompt, 140),
        prompt: md(e.prompt, file, e.line),
        hint: sol?.hint ? md(sol.hint, file, sol.line) : undefined,
        solution: sol ? md(sol.body, file, sol.line) : '',
        check: ov.check,
        source: 'bank',
      }
    }

    const weekSummaries: CourseData['weeks'] = []
    let exCount = 0
    let solCount = 0
    let vidCount = 0
    let vidMissing = 0

    for (const w of plan.weeks) {
      const videos: VideoItem[] = w.videos.map((v, i) => {
        const id = `${w.number}.${i + 1}`
        const entry = videoMap[id] || (v.key ? videoMap[v.key] : undefined)
        if (videoMap[id]) usedVideoKeys.add(id)
        else if (v.key && videoMap[v.key]) usedVideoKeys.add(v.key)
        const ytFromPlan = v.urls.map((u) => /(?:v=|youtu\.be\/)([\w-]{11})/.exec(u)?.[1]).filter(Boolean) as string[]
        let sources = (entry?.sources || []).map((s: any) => ({ title: String(s.title || ''), channel: s.channel || undefined, youtube: s.youtube ? String(s.youtube) : undefined, search: s.search || undefined }))
        if (!sources.length && ytFromPlan.length) sources = ytFromPlan.map((yt) => ({ title: plainText(v.title, 80), youtube: yt, channel: undefined, search: undefined }))
        if (!sources.length && v.key) {
          report.warnings.push(`${slug}: video ${id} (${v.key}) står ikke i videos.yaml`)
          sources = [{ title: plainText(v.title, 80), search: plainText(v.title, 80), youtube: undefined, channel: undefined }]
        }
        vidCount += sources.length
        vidMissing += sources.filter((s: any) => !s.youtube && s.search).length
        const links = v.urls.filter((u) => !/youtu/.test(u))
        return {
          id,
          key: v.key,
          title: inl(v.title, planFile, v.line),
          optional: v.optional,
          added: v.added,
          focus: v.focus ? inl(v.focus.replace(/^\*+|\*+$/g, ''), planFile, v.line) : undefined,
          pause: v.pause ? inl(v.pause.replace(/^\*+|\*+$/g, ''), planFile, v.line) : undefined,
          sources,
          links,
        }
      })

      const exercises: Exercise[] = []
      const solByNum = new Map(w.solutions.map((s) => [s.number, s]))
      for (const e of w.exercises) exercises.push(makeExercise(w, e, solByNum.get(e.number), planFile, 'week'))
      solCount += w.solutions.length
      for (const x of extras)
        for (const xw of x.weeks.filter((xw) => xw.number === w.number)) {
          const sm = new Map(xw.solutions.map((s) => [s.number, s]))
          for (const e of xw.exercises) exercises.push(makeExercise(w, e, sm.get(e.number), x.file, 'extra'))
          solCount += xw.solutions.length
        }
      exCount += exercises.length

      const notesMd = applyInserts(w.notes, overrides.inserts, w.number, 'notes', ovFile, report.errors)
      const week: Week = {
        course: slug,
        number: w.number,
        title: w.title,
        goals: inl(w.goals, planFile, w.line),
        time: inl(w.time, planFile, w.line),
        prereq: inl(w.prereq, planFile, w.line),
        videosIntro: md([w.preamble, w.videosIntro, applyInserts('', overrides.inserts, w.number, 'videos', ovFile, report.errors)].filter(Boolean).join('\n\n'), planFile, w.line),
        videos,
        notes: md([notesMd, w.videosOutro ? `> ${w.videosOutro.split('\n').join('\n> ')}` : ''].filter(Boolean).join('\n\n'), planFile, w.line),
        exercisesIntro: md(applyInserts(w.exercisesIntro, overrides.inserts, w.number, 'exercises', ovFile, report.errors), planFile, w.line),
        exercises,
        connection: md(applyInserts(w.connection || '', overrides.inserts, w.number, 'connection', ovFile, report.errors), planFile, w.line),
        checkpointIntro: md(w.checkpointIntro, planFile, w.line),
        checkpoint: w.checkpoint.map((c) => inl(c, planFile, w.line)),
        extraSections: w.extraSections.map((s) => ({ title: s.title, html: md(s.md, planFile, s.line) })),
      }
      outputs.push({ path: `courses/${slug}/week-${w.number}.json`, data: week })
      weekSummaries.push({
        number: w.number,
        title: w.title,
        videoCount: videos.length,
        exerciseCount: exercises.length,
        checkpointCount: week.checkpoint.length,
        topics: weekTopics(w.number),
      })
      for (const ex of exercises) {
        const { prompt: _p, hint: _h, solution: _s, check: _c, source: _src, ...summary } = ex
        allSummaries.push(summary)
        search.push({ id: ex.id, type: 'exercise', course: slug, week: w.number, title: `Øvelse ${ex.number}`, text: plainText(w.exercises.find((x) => x.number === ex.number)?.prompt || ex.title), href: `/kursus/${slug}/uge/${w.number}/opgave/${ex.number}` })
      }
      search.push({ id: `${slug}/notes/${w.number}`, type: 'note', course: slug, week: w.number, title: `Uge ${w.number}: ${w.title}`, text: plainText(w.notes), href: `/kursus/${slug}/uge/${w.number}` })
      for (const v of videos) search.push({ id: `${slug}/video/${v.id}`, type: 'video', course: slug, week: w.number, title: plainText(v.title, 100), text: v.sources.map((s) => `${s.title} ${s.channel || ''}`).join(' '), href: `/kursus/${slug}/uge/${w.number}#video-${v.id}` })
      for (const t of weekTopics(w.number)) if (!topicIds.has(t)) err(rel('course.yaml'), 0, `ukendt emne ${t}`)
    }
    for (const t of meta.topics) for (const wk of t.weeks) if (!plan.weeks.some((w) => w.number === wk)) err(rel('course.yaml'), 0, `emnet "${t.id}" henviser til uge ${wk}, som ikke findes`)
    for (const k of Object.keys(videoMap)) if (!usedVideoKeys.has(k)) report.warnings.push(`${slug}: videos.yaml-nøglen "${k}" bruges ikke af planen`)

    // ---------- sets (self-test, interview)
    const sets: CourseData['sets'] = []
    const makeSet = (key: 'selftest' | 'interview', raw: { line: number; title: string; intro: string; items: RawQA[] } | undefined) => {
      if (!raw) return 0
      const exercises: Exercise[] = raw.items.map((q) => {
        const ov = overrides.exercises?.[`${key}/${q.number}`] || {}
        const weeks = [...new Set([...`${q.prompt} ${q.answer}`.matchAll(/uge\s+(\d+)/gi)].map((m) => Number(m[1])))]
        const topics = ov.topics || [...new Set(weeks.flatMap(weekTopics))]
        const ex: Exercise = {
          id: `${slug}/${key}/${q.number}`,
          course: slug,
          week: 0,
          number: q.number,
          topics,
          difficulty: (ov.difficulty || 2) as Difficulty,
          kind: ov.kind || key,
          hasHint: false,
          hasCheck: !!ov.check,
          set: key,
          title: plainText(q.prompt, 140),
          prompt: md(q.prompt, planFile, q.line),
          solution: md(q.answer, planFile, q.line),
          check: ov.check,
          source: 'bank',
        }
        return ex
      })
      const set: ExerciseSet = { slug: key, title: raw.title, introHtml: md(raw.intro, planFile, raw.line), exercises }
      outputs.push({ path: `courses/${slug}/set-${key}.json`, data: set })
      sets.push({ slug: key, title: raw.title.replace(/^[^\p{L}]+/u, ''), count: exercises.length })
      for (const ex of exercises) {
        const { prompt: _p, hint: _h, solution: _s, check: _c, source: _src, ...summary } = ex
        allSummaries.push(summary)
        search.push({ id: ex.id, type: 'exercise', course: slug, title: `${set.title.replace(/^[^\p{L}]+/u, '')} ${ex.number}`, text: ex.title, href: `/kursus/${slug}/saet/${key}#q-${ex.number}` })
      }
      return exercises.length
    }
    const nSelf = makeSet('selftest', plan.selftest)
    const nInt = makeSet('interview', plan.interview)

    // ---------- project
    let project: Project | undefined
    if (plan.project) {
      const p = plan.project
      project = {
        title: p.title,
        introHtml: md(p.intro, planFile, p.line),
        parts: p.parts.map((part) => ({ id: part.id, title: part.title, html: md(part.md, planFile, part.line), checklist: part.checklist.map((c) => inl(c, planFile, part.line)) })),
        outroHtml: md(p.outro, planFile, p.line),
      }
    }

    // ---------- info pages + glossary
    const info: InfoPage[] = []
    const glossary: GlossaryEntry[] = []
    for (const s of [...plan.front, ...plan.back]) {
      const title = s.title.replace(/^[^\p{L}\d]+/u, '').trim()
      info.push({ slug: slugify(title), title, html: md(s.md, planFile, s.line) })
      search.push({ id: `${slug}/info/${slugify(title)}`, type: 'info', course: slug, title, text: plainText(s.md).slice(0, 2000), href: `/kursus/${slug}/info/${slugify(title)}` })
      if (/ordliste/i.test(s.title)) {
        for (const g of parseGlossary(s.md)) {
          const entry = { course: slug, da: plainText(g.da), en: plainText(g.en), week: g.week ? plainText(g.week) : undefined }
          glossary.push(entry)
          search.push({ id: `${slug}/glossary/${slugify(entry.da)}`, type: 'glossary', course: slug, title: `${entry.da} — ${entry.en}`, text: `${entry.da} ${entry.en}`, href: `/ordliste?q=${encodeURIComponent(entry.da)}` })
        }
      }
    }

    // ---------- expected counts (optional guard in course.yaml)
    const expect = metaRaw.expect || {}
    const actual: Record<string, number> = { weeks: plan.weeks.length, exercises: exCount, solutions: solCount, selftest: nSelf, interview: nInt }
    for (const [k, v] of Object.entries(expect)) if (actual[k] !== v) err(rel('course.yaml'), 0, `expect.${k} = ${v}, men fandt ${actual[k]}`)
    if (exCount !== solCount) err(planFile, 0, `${exCount} øvelser men ${solCount} løsninger`)

    const courseData: CourseData = {
      meta,
      titleHtml: inl(plan.title, planFile, 1),
      subtitleHtml: md(plan.preface, planFile, 1),
      weeks: weekSummaries,
      info,
      project,
      sets,
      glossary,
      counts: { weeks: plan.weeks.length, exercises: exCount, solutions: solCount, videos: vidCount, videosMissing: vidMissing },
    }
    outputs.push({ path: `courses/${slug}.json`, data: courseData })
    metas.push(meta)
    report.courses.push({ slug, weeks: plan.weeks.length, exercises: exCount, solutions: solCount, videos: vidCount, videosMissing: vidMissing, selftest: nSelf, interview: nInt })
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
    const index: ContentIndex = { generatedAt: new Date().toISOString(), courses: metas, exercises: allSummaries }
    writeFileSync(join(opts.out, 'index.json'), JSON.stringify(index))
    writeFileSync(join(opts.out, 'search.json'), JSON.stringify(search))
  }
  return report
}

function main() {
  const root = join(import.meta.dirname, '..')
  const t0 = Date.now()
  const report = buildContent({ root, out: join(root, 'public/data') })
  for (const w of report.warnings) console.warn(`  ! ${w}`)
  if (!report.ok) {
    for (const e of report.errors) console.error(`✗ ${e.file}${e.line ? `:${e.line}` : ''}: ${e.message}`)
    console.error(`\n${report.errors.length} fejl — indholdet blev ikke bygget.`)
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
