// npm run verify-videos [-- --strict]
// Checks every YouTube ID in content/courses/*/videos.yaml against YouTube's
// oEmbed endpoint (exact title + channel, no consent page) and reports IDs
// whose title or channel doesn't match. Without network it warns and exits 0
// (soft), unless --strict is given. Writes reports/videos.json.

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yaml'

const ROOT = join(import.meta.dirname, '..')
const strict = process.argv.includes('--strict')

/** Channels we accept per course when a source doesn't name one. */
const OFFICIAL = [
  'MIT OpenCourseWare',
  'The Bright Side of Mathematics',
  'Oxford Mathematics',
  'Bartosz Milewski',
  'Numberphile',
  'Computerphile',
  'TrevTutor',
  'Strange Loop Conference',
  'Hausdorff Center for Mathematics',
  'Harvard University',
  'YaleCourses',
  'Quantopian',
  'ritvikmath',
  'Man Group',
  'economification',
]

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bl(\d+)\b/g, '$1') // "L9: Reducibility" ≈ "9. Reducibility"
    .trim()

/** Share of the expected title's words that appear in the actual title. */
export function titleScore(expected: string, actual: string): number {
  const a = new Set(norm(actual).split(' '))
  // Ignore notes in parentheses and anything after a spaced dash ("… — spring over, hvis …").
  const words = norm(expected.replace(/\(.*?\)/g, ' ').split(/\s[—–]\s(?=[^"]*$)/)[0])
    .split(' ')
    .filter((w) => (w.length > 1 || /\d/.test(w)) && !['video', 'part', 'the', 'and', 'of'].includes(w))
  if (!words.length) return 1
  const score = words.filter((w) => a.has(w)).length / words.length
  // Numbers (part, lecture, section) must all match: "Part 3" is not "Part 1".
  return words.some((w) => /^\d+$/.test(w) && !a.has(w)) ? Math.min(score, 0.5) : score
}

export function channelOk(expected: string | undefined, actual: string): boolean {
  const act = norm(actual)
  if (expected) {
    const exp = norm(expected.replace(/\(.*?\)/g, ''))
    if (act.includes(exp) || exp.includes(act)) return true
    // e.g. "Man AHL" vs "Man Group", "MIT OCW" vs "MIT OpenCourseWare"
    const ew = exp.split(' ')
    return ew.some((w) => w.length > 2 && act.split(' ').includes(w))
  }
  return OFFICIAL.some((o) => norm(o) === act)
}

interface Row {
  course: string
  key: string
  index: number
  id: string
  expectedTitle: string
  expectedChannel?: string
  actualTitle?: string
  actualChannel?: string
  status: 'ok' | 'title-mismatch' | 'channel-mismatch' | 'not-found' | 'not-embeddable' | 'network'
  score?: number
}

async function oembed(id: string): Promise<{ title: string; author_name: string } | 'not-found' | 'not-embeddable' | 'network'> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, { signal: AbortSignal.timeout(15000) })
    // 404/400: no such (public) video. 401: exists, but embedding is disabled.
    // Anything else (e.g. a proxy's 403) means we couldn't ask YouTube.
    if (r.status === 404 || r.status === 400) return 'not-found'
    if (r.status === 401) return 'not-embeddable'
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return 'network'
    return (await r.json()) as { title: string; author_name: string }
  } catch {
    return 'network'
  }
}

async function main() {
  const rows: Row[] = []
  const dir = join(ROOT, 'content/courses')
  for (const course of readdirSync(dir)) {
    const f = join(dir, course, 'videos.yaml')
    if (!existsSync(f)) continue
    const data = YAML.parse(readFileSync(f, 'utf8')) || {}
    for (const [key, entry] of Object.entries<any>(data.videos || {}))
      (entry.sources || []).forEach((s: any, index: number) => {
        if (s.youtube) rows.push({ course, key, index, id: String(s.youtube), expectedTitle: s.title, expectedChannel: s.channel, status: 'ok' })
      })
  }
  let offline = 0
  // Small concurrency to be polite.
  for (let i = 0; i < rows.length; i += 8) {
    await Promise.all(
      rows.slice(i, i + 8).map(async (r) => {
        const o = await oembed(r.id)
        if (o === 'network') return (r.status = 'network'), offline++
        if (o === 'not-found' || o === 'not-embeddable') return (r.status = o)
        r.actualTitle = o.title
        r.actualChannel = o.author_name
        r.score = titleScore(r.expectedTitle, o.title)
        if (!channelOk(r.expectedChannel, o.author_name)) r.status = 'channel-mismatch'
        else if (r.score < 0.6) r.status = 'title-mismatch'
      }),
    )
  }
  mkdirSync(join(ROOT, 'reports'), { recursive: true })
  writeFileSync(join(ROOT, 'reports/videos.json'), JSON.stringify({ checkedAt: new Date().toISOString(), rows }, null, 1))
  const bad = rows.filter((r) => r.status !== 'ok' && r.status !== 'network')
  if (offline === rows.length && rows.length) {
    console.warn(`! Ingen forbindelse til YouTube — ${rows.length} video-ID'er blev ikke tjekket.`)
    process.exit(strict ? 1 : 0)
  }
  console.log(`${rows.length} video-ID'er tjekket: ${rows.length - bad.length - offline} ok, ${bad.length} problemer, ${offline} uden svar.`)
  for (const r of bad) console.log(`✗ ${r.course} ${r.key}[${r.index}] ${r.id}: ${r.status} — forventet "${r.expectedTitle}" (${r.expectedChannel || '?'}), fik "${r.actualTitle || ''}" (${r.actualChannel || ''})`)
  process.exit(strict && bad.length ? 1 : 0)
}

if (process.argv[1]?.endsWith('verify-videos.ts')) main()
