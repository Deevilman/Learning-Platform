// npm run import
// Turns the uploaded study plans + video handoffs (content/source/) into course
// folders (content/courses/<slug>/plan.md + videos.yaml). Re-runnable: manual
// edits in videos.yaml (YouTube IDs you added yourself) are kept.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yaml'
import { parsePlan, type RawPlan } from './lib/plan-parser.ts'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'content/source')
const COURSES = join(ROOT, 'content/courses')

interface SourceCfg {
  slug: string
  plan: string
  handoff?: string
}

export interface VideoEntrySource {
  title: string
  channel?: string
  youtube?: string
  search?: string
}

export interface VideosFile {
  // Key: item id ("<week>.<n>") or playlist key ("Q3.2").
  videos: Record<string, { key?: string; sources: VideoEntrySource[] }>
}

export function youtubeId(url: string): string | undefined {
  const m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(url)
  if (m) return m[1]
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim()
  return undefined
}

interface HandoffEntry {
  week: number
  key: string
  title: string
  channel?: string
  youtube?: string
  search?: string
  about?: string // extra description used only for matching
  optional: boolean
}

/** Table rows: | Q1.1 *(optional)* | title | channel | URL | */
function parseTableHandoff(src: string): HandoffEntry[] {
  const out: HandoffEntry[] = []
  for (const line of src.split('\n')) {
    const m = /^\|\s*([A-Z]{1,2}(\d+)\.\d+)\b([^|]*)\|(.*)\|\s*$/.exec(line)
    if (!m) continue
    const cells = m[4].split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'))
    const [title, channel, url] = cells
    const searchM = /Search:\s*`([^`]+)`/.exec(title || '')
    out.push({
      week: Number(m[2]),
      key: m[1],
      title: (title || '').replace(/\*\*/g, '').replace(/Search:.*$/, '').trim(),
      channel,
      youtube: url ? youtubeId(url) : undefined,
      search: searchM ? searchM[1] : undefined,
      optional: /optional/i.test(m[3]),
    })
  }
  return out
}

/** Foundations-style lists: "1.1 P1: `Start Learning Logic | Part 1` (*…*)". */
function parseListHandoff(src: string): HandoffEntry[] {
  const out: HandoffEntry[] = []
  let week = 0
  const channels: Record<string, string> = {}
  for (const line of src.split('\n')) {
    const cm = /^\|\s*(P\d+(?:–P\d+)?|A\d(?:–A\d)?)\s*\|[^|]*\|\s*(.*?)\s*\|\s*$/.exec(line)
    if (cm) channels[cm[1]] = cm[2].replace(/\*\*/g, '')
    const wm = /^### Week (\d+)/.exec(line)
    if (wm) {
      week = Number(wm[1])
      continue
    }
    if (!week) continue
    const im = /^(\d+)\.(\d+)(?:–\d+\.\d+)?\s+(A\d|P\d+)(?:\s*\(optional[^)]*\))?:?\s*(.*)$/.exec(line)
    if (!im) continue
    const key = im[3]
    const rest = im[4]
    const optional = /\(optional/.test(line)
    const url = /https?:\/\/\S+/.exec(rest)?.[0]
    const titles = [...rest.matchAll(/`([^`]+)`/g)].map((x) => x[1])
    const channel = /MIT 18\.404J/.test(rest) ? 'MIT OpenCourseWare' : channels[key] || (key === 'P4' || key === 'P5' ? 'Oxford Mathematics' : undefined)
    // "Start Learning Sets, Parts 1–7 in order: *a*; *b*; …" → one entry per part
    const parts = /Parts?\s+(\d+)[–-](\d+)[^:]*:\s*(.*)$/.exec(rest)
    if (parts && titles.length) {
      const from = Number(parts[1])
      const names = [...parts[3].matchAll(/\*([^*]+)\*/g)].map((x) => x[1]).slice(0, Number(parts[2]) - from + 1)
      names.forEach((name, i) => {
        out.push({ week, key, title: `${titles[0]} | Part ${from + i} (${name})`, channel, search: `Bright Side of Mathematics ${titles[0]} Part ${from + i}`, about: name, optional })
      })
      continue
    }
    let title = titles[0] || rest.replace(/\*\*/g, '').trim()
    const lm = /\*\*(L\d+)\*\*\s*`([^`]+)`/.exec(rest)
    if (lm) title = `${lm[1]}: ${lm[2]}`
    const yt = url ? youtubeId(url) : undefined
    let search: string | undefined
    if (!yt) {
      const sm = /Search\s*`([^`]+)`/.exec(rest)
      search = sm ? sm[1] : `${titles[0] || title} ${channel || ''}`.trim()
      if (key === 'P2') search = `MIT 6.042J ${titles[0]}`
      if (lm) search = `MIT 18.404J Sipser Lecture ${lm[1].slice(1)} ${lm[2]}`
    }
    out.push({ week, key, title, channel, youtube: yt, search, about: rest.replace(/`[^`]*`/g, ''), optional })
  }
  return out
}

// Crude cross-language stemming: compare 5-letter prefixes ("disjunktion" ~ "disjunction").
const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-zæøå0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3).map((w) => w.slice(0, 5)))

function overlap(a: string, b: string) {
  const A = words(a)
  let n = 0
  for (const w of words(b)) if (A.has(w)) n++
  return n
}

function buildVideos(plan: RawPlan, entries: HandoffEntry[], existing: VideosFile | null): { file: VideosFile; report: string[] } {
  const file: VideosFile = { videos: {} }
  const report: string[] = []
  const keyCount = new Map<string, number>()
  for (const w of plan.weeks) for (const v of w.videos) if (v.key) keyCount.set(v.key, (keyCount.get(v.key) || 0) + 1)
  const unique = (k: string) => k && keyCount.get(k) === 1

  for (const w of plan.weeks) {
    const weekEntries = entries.filter((e) => e.week === w.number)
    const assigned = new Map<number, HandoffEntry[]>()
    for (const e of weekEntries) {
      // Candidates: plan items with the same key, or (for added "A" items) items whose text matches.
      let cands = w.videos.map((v, i) => ({ v, i })).filter(({ v }) => v.key === e.key)
      const sameKey = cands.length > 0
      if (!sameKey) cands = w.videos.map((v, i) => ({ v, i }))
      if (!cands.length) {
        report.push(`uge ${w.number}: handoff-video "${e.title}" (${e.key}) passer ikke til noget punkt i planen`)
        continue
      }
      let best = cands[0]
      let bestScore = -1
      for (const c of cands) {
        const yt = c.v.urls.map(youtubeId).filter(Boolean)
        // Ties go to the item with the fewest videos so far (keeps playlist order spread out).
        const score =
          (e.youtube && yt.includes(e.youtube) ? 100 : 0) +
          overlap(`${c.v.title} ${c.v.focus || ''} ${c.v.extra.join(' ')}`, `${e.title} ${e.about || ''}`) -
          0.1 * (assigned.get(c.i)?.length || 0)
        if (score > bestScore) {
          best = c
          bestScore = score
        }
      }
      if (!sameKey && bestScore < 2) {
        report.push(`uge ${w.number}: handoff-video "${e.title}" kunne ikke placeres sikkert`)
        continue
      }
      assigned.set(best.i, [...(assigned.get(best.i) || []), e])
    }

    w.videos.forEach((v, i) => {
      const id = `${w.number}.${i + 1}`
      const fileKey = unique(v.key) ? v.key : id
      const prev = existing?.videos[fileKey]
      const fromHandoff = (assigned.get(i) || []).map((e) => ({ title: e.title, channel: e.channel, youtube: e.youtube, search: e.youtube ? undefined : e.search || `${e.title} ${e.channel || ''}`.trim() }))
      const fromPlan = v.urls
        .map((u) => youtubeId(u))
        .filter((x): x is string => !!x)
        .filter((yt) => !fromHandoff.some((s) => s.youtube === yt))
        .map((yt) => ({ title: v.title.replace(/[*_]/g, '').replace(/:?\s*https?:\/\/\S+/g, '').trim(), youtube: yt }))
      let sources: VideoEntrySource[] = [...fromHandoff, ...fromPlan]
      if (!sources.length && v.search) sources = [{ title: v.search, search: v.search }]
      if (!sources.length && v.key) sources = [{ title: v.title.replace(/[*_]/g, ''), search: v.title.replace(/[*_"]/g, '').replace(/\(.*?\)/g, '').trim() }]
      // Keep IDs that were filled in by hand in an earlier run.
      if (prev) {
        sources = sources.map((s, j) => {
          const p = prev.sources[j]
          return p && p.youtube && !s.youtube ? { ...s, youtube: p.youtube, search: undefined } : s
        })
        if (prev.sources.length > sources.length) sources.push(...prev.sources.slice(sources.length))
      }
      if (sources.length) file.videos[fileKey] = { key: v.key || undefined, sources }
    })
  }
  return { file, report }
}

function main() {
  const cfg = YAML.parse(readFileSync(join(SRC, 'sources.yaml'), 'utf8')) as SourceCfg[]
  let failed = false
  for (const c of cfg) {
    const dir = join(COURSES, c.slug)
    mkdirSync(dir, { recursive: true })
    copyFileSync(join(SRC, c.plan), join(dir, 'plan.md'))
    const plan = parsePlan(readFileSync(join(dir, 'plan.md'), 'utf8'))
    if (plan.errors.length) {
      failed = true
      for (const e of plan.errors) console.error(`✗ ${c.slug}/plan.md:${e.line}: ${e.message}`)
    }
    if (!c.handoff) continue
    const src = readFileSync(join(SRC, c.handoff), 'utf8')
    const entries = /^\|\s*[A-Z]{1,2}\d+\.\d+/m.test(src) ? parseTableHandoff(src) : parseListHandoff(src)
    const vpath = join(dir, 'videos.yaml')
    const existing = existsSync(vpath) ? (YAML.parse(readFileSync(vpath, 'utf8')) as VideosFile) : null
    const { file, report } = buildVideos(plan, entries, existing)
    const header =
      `# Video-ID'er for kurset "${c.slug}". Genereret af "npm run import" ud fra ${c.handoff}.\n` +
      `# Nøgle: playlist-nøglen (fx Q3.2) eller "<uge>.<nr>" for punkter, hvis nøgle går igen.\n` +
      `# Tilføj selv et YouTube-ID under "youtube:" — det bevares, når importen køres igen.\n`
    writeFileSync(vpath, header + YAML.stringify(file, { lineWidth: 0 }))
    const all = Object.values(file.videos).flatMap((v) => v.sources)
    console.log(`✓ ${c.slug}: plan.md kopieret, videos.yaml: ${all.length} videoer (${all.filter((s) => s.youtube).length} med YouTube-ID)`)
    for (const r of report) console.log(`  ! ${r}`)
  }
  if (failed) process.exit(1)
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()!)) main()
