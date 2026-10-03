// Builds one course from its sources (plan, metadata, videos, overrides) into
// the JSON the app reads. Pure: no file system, so it runs both in the content
// build (Node) and in the browser when a learner uploads a course file.

import { parsePlan, parseGlossary, type RawPlan, type RawWeek, type RawQA } from './plan-parser.ts'
import { renderMarkdown, renderInline, plainText, type RenderContext } from './markdown.ts'
import { applyForwardRefs, displayLongMath, firstStep, kindHint, splitSubquestions, type ForwardRefRule } from './exercise-text.ts'
import { makeChoices, shuffledOptions } from '../../src/lib/choices.ts'
import { validateTemplate, type TemplateDef } from '../../src/lib/templates.ts'
import { danishNumbers } from './number-format.ts'
import type { Lesson, AutoCheck, CourseData, CourseMeta, Difficulty, Exercise, ExerciseKind, ExerciseSet, ExerciseSummary, GlossaryEntry, InfoPage, Project, SearchDoc, VideoItem, Week } from '../../src/types/content.ts'

export interface BuildError {
  file: string
  line: number
  message: string
}

/** A short auto-checked question for a bank exercise: either a typed answer (check) or options (first = correct), or both. */
export interface QuizOverride {
  question: string
  check?: AutoCheck
  options?: string[]
  distractors?: (number | string)[]
  explain?: string
}

export interface Overrides {
  exercises?: Record<string, { topics?: string[]; add_topics?: string[]; difficulty?: Difficulty; kind?: ExerciseKind; check?: AutoCheck; hint?: string; quiz?: QuizOverride }>
  inserts?: { week: number; section?: 'notes' | 'connection' | 'exercises' | 'videos'; after?: string; before?: string; markdown: string }[]
}

export const slugify = (s: string) =>
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

export function validateCheck(c: any): string | null {
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

function applyInserts(md: string, inserts: Overrides['inserts'], week: number, section: string, file: string, errors: BuildError[]): string {
  if (!inserts) return md
  let out = md
  for (const ins of inserts.filter((i) => i.week === week && (i.section || 'notes') === section)) {
    if (!ins.after && !ins.before) {
      out = `${out}\n\n${ins.markdown.trim()}\n`
      continue
    }
    const lines = out.split('\n')
    const anchor = (ins.before || ins.after)!
    const hits = lines.map((l, i) => (l.includes(anchor) ? i : -1)).filter((i) => i >= 0)
    if (hits.length !== 1) {
      errors.push({ file, line: 0, message: `insert i uge ${week} (${section}): teksten "${anchor}" blev fundet ${hits.length} gange (skal være præcis 1)` })
      continue
    }
    const idx = hits[0]
    if (ins.before) {
      lines.splice(idx, 0, ins.markdown.trim(), '')
      out = lines.join('\n')
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

export type ForwardRefs = Record<string, (ForwardRefRule & { field: 'prompt' | 'hint' | 'solution' })[]>

/** Everything one course is made of, already read from disk or from an uploaded file. */
export interface CourseSource {
  slug: string
  meta: any
  plan: string
  extras?: { file: string; md: string }[]
  overrides?: Overrides
  videos?: Record<string, any>
  forwardRefs?: ForwardRefs
  /** ```lesson blocks (line = the opening fence). */
  lessons?: { line: number; data: unknown }[]
  /** ```opgaveskabelon blocks (line = the opening fence). */
  templates?: { line: number; data: unknown }[]
  /** Names used in error messages, e.g. "content/courses/quant/plan.md" or the uploaded file's name. */
  files: { meta: string; plan: string; overrides: string; videos: string; forwardRefs: string }
}

export interface BuildEnv {
  interactives: Set<string>
  interactiveMeta: Map<string, { title: string; intro?: string; course?: string }>
  /** Strip raw HTML other than the platform's own (uploaded courses). */
  sanitize?: boolean
}

export interface CourseStats {
  slug: string
  weeks: number
  exercises: number
  solutions: number
  videos: number
  videosMissing: number
  selftest: number
  interview: number
}

export interface CourseBuild {
  meta: CourseMeta
  course: CourseData
  weeks: Week[]
  sets: ExerciseSet[]
  summaries: ExerciseSummary[]
  search: SearchDoc[]
  stats: CourseStats
  errors: BuildError[]
  warnings: string[]
  forwardRefsRemoved?: number
}

export function buildCourse(src: CourseSource, env: BuildEnv): CourseBuild {
    const slug = src.slug
    const { interactives, interactiveMeta } = env
    const report: { errors: BuildError[]; warnings: string[]; forwardRefsRemoved?: number } = { errors: [], warnings: [] }
    const allSummaries: ExerciseSummary[] = []
    const search: SearchDoc[] = []
    const weeks: Week[] = []
    const setFiles: ExerciseSet[] = []
    const err = (file: string, line: number, message: string) => report.errors.push({ file, line, message })

    // ---------- course metadata (course.yaml or the course file's front matter)
    const metaRaw = src.meta || {}
    for (const f of ['slug', 'title', 'short', 'topics']) if (metaRaw[f] === undefined) err(src.files.meta, 0, `mangler feltet "${f}"`)
    if (metaRaw.slug && metaRaw.slug !== slug) err(src.files.meta, 0, `slug "${metaRaw.slug}" matcher ikke mappenavnet "${slug}"`)
    const meta: CourseMeta = {
      slug,
      title: metaRaw.title || slug,
      short: metaRaw.short || '',
      color: metaRaw.color || '#64748b',
      icon: metaRaw.icon || 'book',
      level: metaRaw.level || '',
      estimated_weeks: metaRaw.estimated_weeks || 0,
      prerequisites: metaRaw.requires || metaRaw.prerequisites || [],
      recommendedBefore: metaRaw.recommended_before || [],
      next: metaRaw.next || [],
      lang: metaRaw.lang === 'en' ? 'en' : 'da',
      track: metaRaw.track || undefined,
      exam: metaRaw.exam || undefined,
      topics: (metaRaw.topics || []).map((t: any) => ({ id: String(t.id), name: String(t.name), weeks: (t.weeks || []).map(Number) })),
      disclaimer: metaRaw.disclaimer,
    }
    const topicIds = new Set(meta.topics.map((t) => t.id))
    const weekTopics = (w: number) => meta.topics.filter((t) => t.weeks.includes(w)).map((t) => t.id)

    // ---------- plan (+ extra exercises)
    const planFile = src.files.plan
    if (!src.plan.trim()) err(planFile, 0, 'planen mangler')
    const plan: RawPlan = parsePlan(src.plan)
    for (const e of plan.errors) err(planFile, e.line, e.message)

    const extras: { file: string; weeks: RawWeek[] }[] = []
    for (const x of src.extras || []) {
      const p = parsePlan(x.md, { extra: true })
      for (const e of p.errors) err(x.file, e.line, e.message)
      extras.push({ file: x.file, weeks: p.weeks })
    }

    // ---------- overrides.yaml
    const overrides: Overrides = src.overrides || {}
    const ovFile = src.files.overrides
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
    const videoMap: Record<string, { sources: any[] }> = src.videos || {}
    const usedVideoKeys = new Set<string>()

    const ctx = (file: string, line: number): RenderContext => ({ file, line, interactives, interactiveMeta, errors: report.errors, directives: [], sanitize: env.sanitize })
    const tryIt: CourseData['tryIt'] = []
    const md = (s: string | undefined, file: string, line: number) => (s ? renderMarkdown(s, ctx(file, line)) : '')
    const inl = (s: string | undefined, file: string, line: number) => (s ? renderInline(s, ctx(file, line)) : '')

    // ---------- forward-refs.yaml (reviewed list of remarks that point ahead in the course)
    const frFile = src.files.forwardRefs
    const forwardRefs: ForwardRefs = src.forwardRefs || {}
    for (const [num, rules] of Object.entries(forwardRefs)) {
      if (!allNumbers.has(num)) err(frFile, 0, `ukendt øvelse "${num}"`)
      for (const r of rules) if (!['remove', 'replace', 'keep'].includes(r.action)) err(frFile, 0, `øvelse ${num}: "${r.text.slice(0, 50)}" er ikke gennemgået (action: ${r.action})`)
    }
    /** Remove reviewed forward references, then turn inline (a) (b) … into a list. */
    const tidy = (num: string, field: 'prompt' | 'hint' | 'solution', text: string | undefined) => {
      if (!text) return text
      const rules = (forwardRefs[num] || []).filter((r) => r.field === field)
      const { md: out, problems } = applyForwardRefs(text, rules)
      for (const p of problems) err(frFile, 0, `øvelse ${num} (${field}): ${p}`)
      if (rules.some((r) => r.action !== 'keep')) report.forwardRefsRemoved = (report.forwardRefsRemoved || 0) + rules.filter((r) => r.action !== 'keep').length
      return displayLongMath(splitSubquestions(out))
    }

    /** Hints, one step at a time: a strategy for the kind of exercise, then the plan's hint or the first step of the solution. */
    const hintLadder = (kind: string, planHint: string | undefined, solution: string | undefined, file: string, line: number) => {
      const steps = [kindHint(kind)]
      const second = planHint || (kind !== 'code' && solution ? firstStep(solution) : undefined)
      if (second) steps.push(planHint ? second : `Første skridt: ${second}`)
      return steps.map((h) => md(h, file, line))
    }
    const makeQuiz = (num: string, q: QuizOverride | undefined, file: string, line: number): Exercise['quiz'] => {
      if (!q) return undefined
      const where = `øvelse ${num}: quiz`
      if (!q.question) err(ovFile, 0, `${where} mangler "question"`)
      if (q.check) {
        const msg = validateCheck(q.check)
        if (msg) err(ovFile, 0, `${where}: ${msg}`)
      }
      let choices: { options: string[]; correct: number } | undefined
      if (q.options) {
        if (q.options.length < 3 || new Set(q.options).size !== q.options.length) err(ovFile, 0, `${where}: "options" skal have mindst 3 forskellige svar (det første er det rigtige)`)
        choices = shuffledOptions(q.options, `${slug}/${num}`)
      } else if (q.check) {
        choices = makeChoices(q.check, `${slug}/${num}`, q.distractors) || undefined
        if (!choices) err(ovFile, 0, `${where}: kunne ikke lave svarmuligheder — angiv "options" eller "distractors"`)
      }
      if (!q.check && !choices) err(ovFile, 0, `${where} skal have "check" eller "options"`)
      return { question: md(q.question, file, line), check: q.check, choices, explain: q.explain ? md(q.explain, file, line) : undefined }
    }

    const makeExercise = (w: RawWeek, e0: RawWeek['exercises'][number], sol0: RawWeek['solutions'][number] | undefined, file: string, set: ExerciseSummary['set']): Exercise => {
      const e = { ...e0, prompt: tidy(e0.number, 'prompt', e0.prompt)! }
      const sol = sol0 && { ...sol0, hint: tidy(e0.number, 'hint', sol0.hint), body: tidy(e0.number, 'solution', sol0.body)! }
      const ov = overrides.exercises?.[e.number] || {}
      const topics = ov.topics || [...new Set([...weekTopics(w.number), ...(ov.add_topics || [])])]
      const kind = ov.kind || classify(e.markers, e.prompt)
      const quiz = makeQuiz(e.number, ov.quiz, file, e.line)
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
        hasChoices: ov.check?.type === 'choice' || !!quiz?.choices,
        set,
        title: plainText(e.prompt, 140),
        prompt: md(e.prompt, file, e.line),
        hints: hintLadder(kind, ov.hint || sol?.hint, sol?.body, file, sol?.line ?? e.line),
        solution: sol ? md(sol.body, file, sol.line) : '',
        check: ov.check,
        quiz,
        source: 'bank',
      }
    }

    const weekSummaries: CourseData['weeks'] = []
    let exCount = 0
    let solCount = 0
    let vidCount = 0
    let vidMissing = 0

    const lessonFor = (id: string, key: string, mapKey: string | undefined, focus: string | undefined, pause: string | undefined, line: number): { lesson?: Lesson } => {
      const k = [key, mapKey, id].find((x) => x && lessonBlocks.has(x))
      if (k) {
        usedLessons.add(k)
        return { lesson: makeLesson(lessonBlocks.get(k)!) }
      }
      // a draft from the plan's own words — nothing invented
      if (!focus && !pause) return {}
      const clean = (s: string) => inl(s.replace(/^\*+|\*+$/g, ''), planFile, line)
      return { lesson: { goals: focus ? [clean(focus)] : [], questions: pause ? [{ prompt: clean(pause) }] : [], draft: true } }
    }
    // ---------- lessons (```lesson blocks), matched to videos by key, map key or "<week>.<n>"
    const lessonBlocks = new Map<string, { line: number; data: any }>()
    for (const b of src.lessons || []) {
      const d = b.data as any
      if (!d || typeof d !== 'object' || !d.video) {
        err(src.files.plan, b.line, 'En lesson-blok skal have "video:" med videoens nøgle (fx Q1.2) eller nummer (fx 1.2).')
        continue
      }
      if (lessonBlocks.has(String(d.video))) err(src.files.plan, b.line, `Der er to lesson-blokke for videoen "${d.video}".`)
      lessonBlocks.set(String(d.video), b)
    }
    const usedLessons = new Set<string>()
    const makeLesson = (b: { line: number; data: any }): Lesson => {
      const d = b.data
      const at = (m: string) => err(src.files.plan, b.line, `Lektionen for "${d.video}": ${m}`)
      for (const k of Object.keys(d)) if (!['video', 'maal', 'opsummering', 'spoergsmaal', 'udkast'].includes(k)) at(`ukendt felt "${k}" (brug video, maal, opsummering, spoergsmaal).`)
      const goals = Array.isArray(d.maal) ? d.maal.map(String) : d.maal ? [String(d.maal)] : []
      if (!goals.length) at('"maal" mangler (hvad eleven skal lære).')
      const qs = Array.isArray(d.spoergsmaal) ? d.spoergsmaal : []
      if (qs.length && (qs.length < 2 || qs.length > 4)) report.warnings.push(`${slug}: lektionen for "${d.video}" har ${qs.length} spørgsmål (2–4 anbefales)`)
      const questions = qs.map((q: any, i: number) => {
        if (!q || typeof q !== 'object' || !q.spoergsmaal) {
          at(`spørgsmål ${i + 1} skal have "spoergsmaal:".`)
          return { prompt: '' }
        }
        const prompt = inl(String(q.spoergsmaal), src.files.plan, b.line)
        if (Array.isArray(q.muligheder)) {
          const opts = q.muligheder.map(String)
          if (q.svar === undefined || !opts.includes(String(q.svar))) at(`spørgsmål ${i + 1}: "svar" skal være en af "muligheder".`)
          const right = String(q.svar)
          const shuffled = shuffledOptions([right, ...opts.filter((o: string) => o !== right)], `${slug}/${d.video}/${i}`)
          return { prompt, options: shuffled.options.map((o) => inl(o, src.files.plan, b.line)), correct: shuffled.correct }
        }
        return { prompt, ...(q.svar !== undefined ? { answer: inl(String(q.svar), src.files.plan, b.line) } : {}) }
      })
      return { goals: goals.map((g: string) => inl(g, src.files.plan, b.line)), ...(d.opsummering ? { summary: md(String(d.opsummering), src.files.plan, b.line) } : {}), questions, ...(d.udkast ? { draft: true } : {}) }
    }

    for (const w of plan.weeks) {
      const videos: VideoItem[] = w.videos.map((v, i): VideoItem | null => {
        const id = `${w.number}.${i + 1}`
        const entry: any = videoMap[id] || (v.key ? videoMap[v.key] : undefined)
        const mapKey = videoMap[id] ? undefined : v.key && videoMap[v.key] ? v.key : undefined
        if (videoMap[id]) usedVideoKeys.add(id)
        else if (v.key && videoMap[v.key]) usedVideoKeys.add(v.key)
        // "remove: true": no suitable video exists and the notes cover it — drop the item (ids of the others stay stable)
        if (entry?.remove) return null
        const ytFromPlan = v.urls.map((u) => /(?:v=|youtu\.be\/)([\w-]{11})/.exec(u)?.[1]).filter(Boolean) as string[]
        let sources = (entry?.sources || []).map((s: any) => ({
          title: String(s.title || ''),
          channel: s.channel || undefined,
          youtube: s.youtube && s.access !== 'steady' ? String(s.youtube) : undefined,
          search: s.access === 'steady' ? undefined : s.search || undefined,
          ...(s.embed === false ? { embed: false as const } : {}),
          ...(s.access === 'steady' ? { access: 'steady' as const, url: String(s.url || '') } : {}),
        }))
        for (const s of sources) if (s.access === 'steady' && !/^https:\/\//.test(s.url || '')) err(src.files.videos, 0, `video ${id}: "access: steady" kræver et https-link i "url"`)
        const explicit = Array.isArray(entry?.sources) // an explicit (possibly empty) list: no search fallback
        if (!sources.length && ytFromPlan.length) sources = ytFromPlan.map((yt) => ({ title: plainText(v.title, 80), youtube: yt, channel: undefined, search: undefined }))
        if (!sources.length && v.key && !explicit) {
          report.warnings.push(`${slug}: video ${id} (${v.key}) står ikke i videos.yaml`)
          sources = [{ title: plainText(v.title, 80), search: plainText(v.title, 80), youtube: undefined, channel: undefined }]
        }
        vidCount += sources.length
        vidMissing += sources.filter((s: any) => !s.youtube && s.search).length
        const links = [...v.urls.filter((u) => !/youtu/.test(u)), ...(entry?.links || []).map(String)]
        return {
          id,
          ...(mapKey ? { progressKey: mapKey } : {}),
          key: v.key,
          title: entry?.title ? inl(String(entry.title), planFile, v.line) : inl(v.title.replace(/\s*[—–-]\s*\(valgfri\)\s*$/, ''), planFile, v.line),
          optional: v.optional,
          added: v.added,
          focus: v.focus ? inl(v.focus.replace(/^\*+|\*+$/g, ''), planFile, v.line) : undefined,
          pause: v.pause ? inl(v.pause.replace(/^\*+|\*+$/g, ''), planFile, v.line) : undefined,
          sources,
          links,
          ...lessonFor(id, v.key, mapKey, v.focus, v.pause, v.line),
        }
      }).filter((v): v is VideoItem => v !== null)

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
      for (const m of notesMd.matchAll(/::interactive\{([^}]*)\}/g)) {
        const id = /id="([^"]+)"/.exec(m[1])?.[1]
        const meta = id && interactiveMeta.get(id)
        if (id && meta) tryIt.push({ id, title: meta.title, intro: meta.intro ? renderInline(meta.intro, ctx(ovFile, 0)) : undefined, week: w.number })
      }
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
      weeks.push(week)
      weekSummaries.push({
        number: w.number,
        title: w.title,
        videoCount: videos.length,
        videos: videos.map((v) => ({ id: v.id, ...(v.progressKey ? { progressKey: v.progressKey } : {}) })),
        exerciseCount: exercises.length,
        checkpointCount: week.checkpoint.length,
        topics: weekTopics(w.number),
      })
      for (const ex of exercises) {
        const { prompt: _p, hints: _h, solution: _s, check: _c, quiz: _q, source: _src, ...summary } = ex
        allSummaries.push(summary)
        search.push({ id: ex.id, type: 'exercise', course: slug, week: w.number, title: `Øvelse ${ex.number}`, text: plainText(w.exercises.find((x) => x.number === ex.number)?.prompt || ex.title), href: `/kursus/${slug}/uge/${w.number}/opgave/${ex.number}` })
      }
      search.push({ id: `${slug}/notes/${w.number}`, type: 'note', course: slug, week: w.number, title: `Uge ${w.number}: ${w.title}`, text: plainText(w.notes), href: `/kursus/${slug}/uge/${w.number}` })
      for (const v of videos) search.push({ id: `${slug}/video/${v.id}`, type: 'video', course: slug, week: w.number, title: plainText(v.title, 100), text: v.sources.map((s) => `${s.title} ${s.channel || ''}`).join(' '), href: `/kursus/${slug}/uge/${w.number}#video-${v.id}` })
      for (const t of weekTopics(w.number)) if (!topicIds.has(t)) err(src.files.meta, 0, `ukendt emne ${t}`)
    }
    for (const t of meta.topics) for (const wk of t.weeks) if (!plan.weeks.some((w) => w.number === wk)) err(src.files.meta, 0, `emnet "${t.id}" henviser til uge ${wk}, som ikke findes`)
    for (const k of Object.keys(videoMap)) if (!usedVideoKeys.has(k)) report.warnings.push(`${slug}: videos.yaml-nøglen "${k}" bruges ikke af planen`)

    // ---------- sets (self-test, interview)
    const sets: CourseData['sets'] = []
    const makeSet = (key: 'selftest' | 'interview', raw: { line: number; title: string; intro: string; items: RawQA[] } | undefined) => {
      if (!raw) return 0
      const exercises: Exercise[] = raw.items.map((q0) => {
        let q = q0
        const ov = overrides.exercises?.[`${key}/${q.number}`] || {}
        const weeks = [...new Set([...`${q.prompt} ${q.answer}`.matchAll(/uge\s+(\d+)/gi)].map((m) => Number(m[1])))]
        q = { ...q, prompt: displayLongMath(splitSubquestions(q.prompt)), answer: displayLongMath(splitSubquestions(q.answer)) }
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
          hasChoices: ov.check?.type === 'choice',
          set: key,
          title: plainText(q.prompt, 140),
          prompt: md(q.prompt, planFile, q.line),
          hints: hintLadder(ov.kind || key, ov.hint, q.answer, planFile, q.line),
          solution: md(q.answer, planFile, q.line),
          check: ov.check,
          source: 'bank',
        }
        return ex
      })
      const set: ExerciseSet = { slug: key, title: raw.title, introHtml: md(raw.intro, planFile, raw.line), exercises }
      setFiles.push(set)
      sets.push({ slug: key, title: raw.title.replace(/^[^\p{L}]+/u, ''), count: exercises.length })
      for (const ex of exercises) {
        const { prompt: _p, hints: _h, solution: _s, check: _c, quiz: _q, source: _src, ...summary } = ex
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
    for (const [k, v] of Object.entries(expect)) if (actual[k] !== v) err(src.files.meta, 0, `expect.${k} = ${v}, men fandt ${actual[k]}`)
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
      tryIt,
    }
    for (const [k, b] of lessonBlocks) if (!usedLessons.has(k)) err(src.files.plan, b.line, `Lektionen er til videoen "${k}", men den video findes ikke i planen (brug videoens nøgle, fx T1, eller nummer, fx 1.2).`)

    // ---------- number format: the courses use 1,234.5
    const danish = danishNumbers(src.plan)
    for (const d of danish.slice(0, 20)) report.warnings.push(`${planFile}:${d.line}: "${d.text}" ligner dansk talformat (${d.reason.toLowerCase()}). Skriv tal som 1,234.5.`)
    if (danish.length > 20) report.warnings.push(`${planFile}: ${danish.length - 20} tal mere ligner dansk talformat`)

    // ---------- exercise templates: each must pass 200 seeds
    const templates: TemplateDef[] = []
    for (const t of src.templates || []) {
      const def = t.data as TemplateDef
      const r = validateTemplate(def)
      for (const e of r.errors) err(src.files.plan, t.line, `Opgaveskabelonen "${r.id}": ${e}`)
      if (r.errors.length) continue
      const unknown = def.emner.filter((x) => !topicIds.has(x))
      if (unknown.length) err(src.files.plan, t.line, `Opgaveskabelonen "${r.id}": emnet ${unknown.map((x) => `"${x}"`).join(', ')} står ikke under "topics" i front matter.`)
      if (templates.some((x) => x.id === def.id)) err(src.files.plan, t.line, `Opgaveskabelonen "${r.id}" findes to gange.`)
      templates.push({ ...def, kursus: slug })
    }
    if (templates.length) courseData.templates = templates
    const stats: CourseStats = ({ slug, weeks: plan.weeks.length, exercises: exCount, solutions: solCount, videos: vidCount, videosMissing: vidMissing, selftest: nSelf, interview: nInt })
    return { meta, course: courseData, weeks, sets: setFiles, summaries: allSummaries, search, stats, ...report }
}
