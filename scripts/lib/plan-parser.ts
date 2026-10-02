// Parses a study plan (plan.md) in the format described in CONTENT_GUIDE.md
// into raw Markdown pieces. Rendering to HTML happens in markdown.ts.

export interface ParseError {
  line: number
  message: string
}

export interface RawVideo {
  line: number
  key: string
  title: string
  optional: boolean
  added: boolean
  focus?: string
  pause?: string
  extra: string[]
  urls: string[]
  search?: string
}

export interface RawExercise {
  line: number
  number: string
  stars: number
  markers: string[]
  prompt: string
}

export interface RawSolution {
  line: number
  number: string
  body: string
  hint?: string
}

export interface RawWeek {
  line: number
  number: number
  title: string
  goals?: string
  time?: string
  prereq?: string
  preamble: string
  videosIntro: string
  videos: RawVideo[]
  videosOutro: string
  notes: string
  exercisesIntro: string
  exercises: RawExercise[]
  solutions: RawSolution[]
  connection?: string
  checkpointIntro: string
  checkpoint: string[]
  extraSections: { title: string; md: string; line: number }[]
}

export interface RawQA {
  line: number
  number: string
  prompt: string
  answer: string
}

export interface RawSection {
  line: number
  title: string
  md: string
}

export interface RawProjectPart {
  line: number
  id: string
  title: string
  md: string
  checklist: string[]
}

export interface RawPlan {
  title: string
  preface: string
  front: RawSection[]
  weeks: RawWeek[]
  project?: { line: number; title: string; intro: string; parts: RawProjectPart[]; outro: string }
  selftest?: { line: number; title: string; intro: string; items: RawQA[] }
  interview?: { line: number; title: string; intro: string; items: RawQA[] }
  back: RawSection[]
  errors: ParseError[]
}

interface Line {
  n: number // 1-based line number in the source file
  text: string
  inFence: boolean // true for lines inside (or delimiting) a fenced code block
}

function toLines(src: string): Line[] {
  const out: Line[] = []
  let fence: string | null = null
  src.replace(/\r\n/g, '\n').split('\n').forEach((text, i) => {
    const m = /^\s*(```+|~~~+)/.exec(text)
    if (m) {
      const marker = m[1]
      if (fence === null) {
        fence = marker
        out.push({ n: i + 1, text, inFence: true })
        return
      }
      if (marker.startsWith(fence[0]) && marker.length >= fence.length) {
        out.push({ n: i + 1, text, inFence: true })
        fence = null
        return
      }
    }
    out.push({ n: i + 1, text, inFence: fence !== null })
  })
  return out
}

const join = (lines: Line[]) => lines.map((l) => l.text).join('\n').trim()

/** Split lines at headings of the given level (outside code fences). */
function splitHeadings(lines: Line[], level: number) {
  const prefix = '#'.repeat(level) + ' '
  const head: Line[] = []
  const sections: { title: string; line: number; body: Line[] }[] = []
  for (const l of lines) {
    if (!l.inFence && l.text.startsWith(prefix)) {
      sections.push({ title: l.text.slice(prefix.length).trim(), line: l.n, body: [] })
    } else if (sections.length) {
      sections[sections.length - 1].body.push(l)
    } else {
      head.push(l)
    }
  }
  return { head, sections }
}

/** Drop trailing horizontal rules (section separators). */
function trimRules(lines: Line[]): Line[] {
  const out = [...lines]
  while (out.length && (out[out.length - 1].text.trim() === '' || out[out.length - 1].text.trim() === '---')) out.pop()
  return out
}

const WEEK_RE = /^Uge\s+(\d+)\s*[—–-]\s*(.+)$/

export function parsePlan(src: string, opts: { extra?: boolean } = {}): RawPlan {
  const errors: ParseError[] = []
  const lines = toLines(src)
  const { head, sections } = splitHeadings(lines, 2)

  const h1 = head.find((l) => !l.inFence && l.text.startsWith('# '))
  const title = h1 ? h1.text.slice(2).trim() : 'Uden titel'
  const preface = join(trimRules(head.filter((l) => l !== h1)))

  const plan: RawPlan = { title, preface, front: [], weeks: [], back: [], errors }
  let seenWeek = false

  for (const s of sections) {
    const body = trimRules(s.body)
    const wm = WEEK_RE.exec(s.title)
    if (wm) {
      seenWeek = true
      plan.weeks.push(parseWeek(Number(wm[1]), wm[2].trim(), s.line, body, errors, !!opts.extra))
    } else if (/Afsluttende projekt/i.test(s.title)) {
      plan.project = parseProject(s.title, s.line, body)
    } else if (/Interview/i.test(s.title)) {
      plan.interview = { line: s.line, title: s.title, ...parseQA(body, errors) }
    } else if (/selvtest/i.test(s.title)) {
      plan.selftest = { line: s.line, title: s.title, ...parseQA(body, errors) }
    } else {
      ;(seenWeek ? plan.back : plan.front).push({ line: s.line, title: s.title, md: join(body) })
    }
  }

  if (!opts.extra) plan.weeks.forEach((w, i) => {
    if (w.number !== i + 1) errors.push({ line: w.line, message: `Uge ${w.number} står på plads ${i + 1}; ugerne skal være nummereret 1, 2, 3, …` })
  })
  return plan
}

function parseWeek(number: number, title: string, line: number, body: Line[], errors: ParseError[], extra: boolean): RawWeek {
  const { head, sections } = splitHeadings(body, 3)
  const week: RawWeek = {
    line,
    number,
    title,
    preamble: '',
    videosIntro: '',
    videos: [],
    videosOutro: '',
    notes: '',
    exercisesIntro: '',
    exercises: [],
    solutions: [],
    checkpointIntro: '',
    checkpoint: [],
    extraSections: [],
  }

  // Blockquote with Læringsmål / Tidsforbrug / Forudsætninger.
  const rest: Line[] = []
  for (const l of head) {
    const m = /^>\s*\*\*(Læringsmål|Tidsforbrug|Forudsætninger):\*\*\s*(.*)$/.exec(l.text)
    if (m) {
      if (m[1] === 'Læringsmål') week.goals = m[2].trim()
      else if (m[1] === 'Tidsforbrug') week.time = m[2].trim()
      else week.prereq = m[2].trim()
    } else rest.push(l)
  }
  week.preamble = join(trimRules(rest))
  if (!week.goals && !extra) errors.push({ line, message: `Uge ${number}: mangler "**Læringsmål:**" i blokcitatet` })

  for (const s of sections) {
    const b = trimRules(s.body)
    if (s.title.startsWith('📺')) parseVideos(b, week, errors)
    else if (s.title.startsWith('🧠')) week.notes = join(b)
    else if (s.title.startsWith('✏️')) parseExercises(b, week, errors)
    else if (s.title.startsWith('✅')) parseSolutions(b, week, errors)
    else if (s.title.startsWith('🔗')) week.connection = join(b)
    else if (s.title.startsWith('🏁')) parseCheckpoint(b, week)
    else week.extraSections.push({ title: s.title, md: join(b), line: s.line })
  }

  if (!week.notes && !extra) errors.push({ line, message: `Uge ${number}: mangler afsnittet "### 🧠 Kernebegreber"` })
  if (!week.exercises.length) errors.push({ line, message: `Uge ${number}: ingen øvelser fundet under "### ✏️ Øvelser"` })

  // Every exercise needs exactly one solution and vice versa.
  const solNums = new Map(week.solutions.map((s) => [s.number, s]))
  for (const ex of week.exercises) {
    if (!solNums.has(ex.number)) errors.push({ line: ex.line, message: `Øvelse ${ex.number} har ingen løsning` })
    if (!ex.number.startsWith(`${number}.`)) errors.push({ line: ex.line, message: `Øvelse ${ex.number} står i uge ${number}` })
  }
  const exNums = new Set(week.exercises.map((e) => e.number))
  const seen = new Set<string>()
  for (const s of week.solutions) {
    if (!exNums.has(s.number)) errors.push({ line: s.line, message: `Løsning ${s.number} hører ikke til nogen øvelse i uge ${number}` })
    if (seen.has(s.number)) errors.push({ line: s.line, message: `Løsning ${s.number} findes to gange` })
    seen.add(s.number)
  }
  const seenEx = new Set<string>()
  for (const e of week.exercises) {
    if (seenEx.has(e.number)) errors.push({ line: e.line, message: `Øvelse ${e.number} findes to gange` })
    seenEx.add(e.number)
  }
  return week
}

const VIDEO_RE = /^- \[[ xX]\]\s+(.*)$/
const KEY_RE = /^\*\*([A-Z]+\d+(?:\.\d+)*)\*\*\s*(.*)$/
const URL_RE = /https?:\/\/[^\s)>\]]+/g

function stripLabel(s: string, label: string) {
  // "  - *Fokus:* x", "  Fokus: x", "  - **Fokus:** x"
  const re = new RegExp(`^\\s*(?:[-*]\\s+)?(?:\\*{1,2})?${label}:(?:\\*{1,2})?\\s*(.*)$`)
  const m = re.exec(s)
  return m ? m[1].trim() : null
}

function parseVideos(lines: Line[], week: RawWeek, errors: ParseError[]) {
  const intro: Line[] = []
  const outro: Line[] = []
  let cur: RawVideo | null = null
  for (const l of lines) {
    const m = VIDEO_RE.exec(l.text)
    if (m && !l.inFence) {
      let text = m[1].trim()
      let key = ''
      const km = KEY_RE.exec(text)
      if (km) {
        key = km[1]
        text = km[2].trim()
      } else {
        // Looser forms: "**P1 Start Learning Sets – …**", "**(valgfri) P7 L1 "…"**", "**P2: videoerne om …**"
        const head = text.replace(/\((?:tilføjet|valgfri)[^)]*\)/gi, '').replace(/[*_]/g, '').trim().slice(0, 30)
        const lm = /^([A-Z]{1,2}\d+(?:\.\d+)?)(?=[\s:–—-]|$)/.exec(head)
        if (lm) key = lm[1]
      }
      const optional = /valgfri/i.test(m[1])
      const added = /tilføjet/i.test(m[1])
      cur = { line: l.n, key, title: text, optional, added, extra: [], urls: [] }
      week.videos.push(cur)
      continue
    }
    if (!cur) {
      intro.push(l)
      continue
    }
    if (/^\s+\S/.test(l.text)) {
      const focus = stripLabel(l.text, 'Fokus')
      const pause = stripLabel(l.text, 'Pause og tænk')
      if (focus !== null) cur.focus = focus
      else if (pause !== null) cur.pause = pause
      else cur.extra.push(l.text.trim().replace(/^[-*]\s+/, ''))
    } else if (l.text.trim() === '') {
      continue
    } else {
      // Unindented text after the list ends the list.
      outro.push(l)
      cur = null
    }
  }
  for (const v of week.videos) {
    const all = `${v.title} ${v.extra.join(' ')}`
    v.urls = [...all.matchAll(URL_RE)].map((x) => x[0].replace(/[.,;:*]+$/, ''))
    const sm = /søg(?:\s+(?:på|efter))?:?\s*["“]([^"”]+)["”]/i.exec(all)
    if (sm) v.search = sm[1]
    if (!v.key && !v.added && !v.urls.length && !v.search) errors.push({ line: v.line, message: `Video uden nøgle (**P1**, **Q1.1** …), URL eller søgning` })
  }
  week.videosIntro = join(intro)
  week.videosOutro = join(outro)
}

const EX_RE = /^\*\*(\d+\.E?\d+)\*\*\s*(★{1,3})\s*([^—]*?)\s*—\s*(.*)$/u

function parseExercises(lines: Line[], week: RawWeek, errors: ParseError[]) {
  const intro: Line[] = []
  let cur: { ex: RawExercise; body: Line[] } | null = null
  const flush = () => {
    if (cur) cur.ex.prompt = [cur.ex.prompt, join(cur.body)].filter(Boolean).join('\n')
  }
  for (const l of lines) {
    const m = l.inFence ? null : EX_RE.exec(l.text)
    if (m) {
      flush()
      const markers = [...m[3].matchAll(/💻|🗣️|🗣/gu)].map((x) => (x[0] === '🗣' ? '🗣️' : x[0]))
      const leftover = m[3].replace(/💻|🗣️|🗣|\s/gu, '')
      if (leftover) errors.push({ line: l.n, message: `Ukendt markør "${leftover}" i øvelse ${m[1]}` })
      cur = { ex: { line: l.n, number: m[1], stars: m[2].length, markers, prompt: m[4].trim() }, body: [] }
      week.exercises.push(cur.ex)
    } else if (cur) {
      cur.body.push(l)
    } else {
      if (!l.inFence && /^\*\*\d+\.\d+\*\*/.test(l.text)) errors.push({ line: l.n, message: `Øvelseslinjen kunne ikke læses: "${l.text.slice(0, 60)}…" (forventet "**N.k** ★★ — tekst")` })
      intro.push(l)
    }
  }
  flush()
  week.exercisesIntro = join(intro)
}

/** Extract top-level <details> blocks: returns summary text + inner body + line. */
export function extractDetails(lines: Line[]) {
  const blocks: { summary: string; body: string; line: number }[] = []
  const outside: Line[] = []
  let depth = 0
  let start = 0
  let buf: Line[] = []
  for (const l of lines) {
    const opens = l.inFence ? 0 : (l.text.match(/<details\b[^>]*>/g) || []).length
    const closes = l.inFence ? 0 : (l.text.match(/<\/details>/g) || []).length
    if (depth === 0 && opens > 0) {
      depth += opens - closes
      start = l.n
      buf = [l]
      if (depth === 0) finish()
      continue
    }
    if (depth > 0) {
      buf.push(l)
      depth += opens - closes
      if (depth <= 0) {
        depth = 0
        finish()
      }
      continue
    }
    outside.push(l)
  }
  function finish() {
    const text = buf.map((x) => x.text).join('\n')
    const m = /^\s*<details\b[^>]*>\s*(?:<summary>([\s\S]*?)<\/summary>)?([\s\S]*)<\/details>\s*$/.exec(text)
    if (m) blocks.push({ summary: (m[1] || '').trim(), body: m[2].trim(), line: start })
    buf = []
  }
  return { blocks, outside }
}

const HINT_RE = /^(?:\*\*Hint:?\*\*:?|\*Hint:?\*:?|Hint:)\s*(.*)$/

function splitHint(body: string): { hint?: string; body: string } {
  const lines = body.split('\n')
  const i = lines.findIndex((l) => l.trim() !== '')
  if (i < 0) return { body }
  const m = HINT_RE.exec(lines[i].trim())
  if (!m) return { body }
  // The hint is the first paragraph.
  let j = i + 1
  const hintLines = [m[1]]
  while (j < lines.length && lines[j].trim() !== '') hintLines.push(lines[j++])
  return { hint: hintLines.join('\n').trim(), body: lines.slice(j).join('\n').trim() }
}

function parseSolutions(lines: Line[], week: RawWeek, errors: ParseError[]) {
  const { blocks } = extractDetails(lines)
  for (const b of blocks) {
    const m = /^Løsning\s+(\d+\.E?\d+)/.exec(b.summary)
    if (!m) {
      errors.push({ line: b.line, message: `Ukendt <summary> i løsninger: "${b.summary}" (forventet "Løsning N.k")` })
      continue
    }
    const { hint, body } = splitHint(b.body)
    week.solutions.push({ line: b.line, number: m[1], body, hint })
  }
}

function parseCheckpoint(lines: Line[], week: RawWeek) {
  const intro: Line[] = []
  for (const l of lines) {
    const m = VIDEO_RE.exec(l.text)
    if (m && !l.inFence) week.checkpoint.push(m[1].trim())
    else if (/^\s+\S/.test(l.text) && week.checkpoint.length) week.checkpoint[week.checkpoint.length - 1] += ' ' + l.text.trim()
    else if (!week.checkpoint.length) intro.push(l)
  }
  week.checkpointIntro = join(intro)
}

const QA_RE = /^\*\*(\d+)\.\*\*\s*(.*)$/

function parseQA(lines: Line[], errors: ParseError[]) {
  const intro: Line[] = []
  const items: RawQA[] = []
  let cur: { qa: RawQA; body: Line[] } | null = null
  const finish = () => {
    if (!cur) return
    const { blocks, outside } = extractDetails(cur.body)
    cur.qa.prompt = [cur.qa.prompt, join(trimRules(outside))].filter(Boolean).join('\n')
    const ans = blocks.find((b) => /^(Svar|Løsning)/.test(b.summary))
    if (!ans) errors.push({ line: cur.qa.line, message: `Spørgsmål ${cur.qa.number} har intet <details><summary>Svar</summary>` })
    cur.qa.answer = ans ? ans.body : ''
    items.push(cur.qa)
  }
  for (const l of lines) {
    const m = l.inFence ? null : QA_RE.exec(l.text)
    if (m) {
      finish()
      cur = { qa: { line: l.n, number: m[1], prompt: m[2].trim(), answer: '' }, body: [] }
    } else if (cur) cur.body.push(l)
    else intro.push(l)
  }
  finish()
  return { intro: join(intro), items }
}

function parseProject(title: string, line: number, body: Line[]) {
  const { head, sections } = splitHeadings(body, 3)
  const parts: RawProjectPart[] = []
  const outro: string[] = []
  for (const s of sections) {
    const m = /^Del\s+([A-Z])\b\s*[—–-]?\s*(.*)$/.exec(s.title)
    if (!m) {
      outro.push(`### ${s.title}\n\n${join(trimRules(s.body))}`)
      continue
    }
    const checklist: string[] = []
    for (const l of s.body) {
      const cm = VIDEO_RE.exec(l.text)
      if (cm && !l.inFence) checklist.push(cm[1].trim())
    }
    const md = trimRules(s.body)
      .filter((l) => l.inFence || !VIDEO_RE.test(l.text))
      .map((l) => l.text)
      .join('\n')
      .trim()
    parts.push({ line: s.line, id: m[1], title: m[2].trim() || `Del ${m[1]}`, md, checklist })
  }
  return { line, title, intro: join(trimRules(head)), parts, outro: outro.join('\n\n') }
}

/** Parse "| Dansk | Engelsk | Uge |" glossary tables. */
export function parseGlossary(md: string): { da: string; en: string; week?: string }[] {
  const out: { da: string; en: string; week?: string }[] = []
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length < 2 || /^:?-+:?$/.test(cells[0]) || /^dansk$/i.test(cells[0])) continue
    out.push({ da: cells[0], en: cells[1], week: cells[2] })
  }
  return out
}
