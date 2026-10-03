// npm run find-videos
// Helper for filling in missing video IDs (run where YouTube is reachable,
// e.g. in GitHub Actions). It reads official playlists and channel playlist
// pages, and runs a YouTube search for every source in videos.yaml that has
// no ID yet. Results (ID, title, channel) go to reports/video-candidates.json
// for a human — or a later commit — to pick from. Nothing is written to
// videos.yaml; picked IDs must still pass `npm run verify-videos`.

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yaml'

const ROOT = join(import.meta.dirname, '..')
const HEADERS = { 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' }

const PLAYLISTS: Record<string, string> = {
  'MIT 6.042J Spring 2015': 'PLUl4u3cNGP60UlabZBeeqOuoLuj_KNphQ',
  'MIT 18.404J Fall 2020': 'PLUl4u3cNGP60_JNv2MmK3wkOt9syvfQWY',
  'Oxford 3rd year lectures': 'PL4d5ZtfQonW2Re7v-RChGIZEqupAqSSns',
  'Milewski Category Theory': 'PLbgaMIhjbmEnaH_LTkxLI7FMa2HsnawM_',
}
/** Channel playlist pages to scan for series such as "Start Learning …". */
const CHANNELS = ['@brightsideofmaths', '@TrevTutor']
const SERIES = /start learning|discrete math/i

interface Video {
  id: string
  title: string
  channel?: string
}

const text = (t: any): string => (t?.simpleText ?? t?.runs?.map((r: any) => r.text).join('') ?? t?.content ?? '') as string

function walk(o: any, fn: (k: string, v: any) => void) {
  if (!o || typeof o !== 'object') return
  for (const [k, v] of Object.entries(o)) {
    fn(k, v)
    walk(v, fn)
  }
}

const CLIENT = { clientName: 'WEB', clientVersion: '2.20250101.00.00', hl: 'en', gl: 'US' }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** POST to YouTube's internal API, sequentially, with backoff on failures. */
async function api(endpoint: 'browse' | 'search', body: object): Promise<any> {
  let last: unknown
  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(attempt ? 2000 * 2 ** attempt : 800)
    try {
      const r = await fetch(`https://www.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false`, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json', Cookie: 'SOCS=CAI; CONSENT=YES+1' },
        body: JSON.stringify({ context: { client: CLIENT }, ...body }),
        signal: AbortSignal.timeout(20000),
      })
      if (r.ok) return await r.json()
      last = new Error(`${r.status} ${endpoint}`)
    } catch (e) {
      last = e
    }
  }
  throw last
}

function collectVideos(data: any, out: Video[]): string | null {
  let next: string | null = null
  walk(data, (k, v) => {
    if (k === 'playlistVideoRenderer' && v.videoId) out.push({ id: v.videoId, title: text(v.title), channel: text(v.shortBylineText) })
    if (k === 'videoRenderer' && v.videoId) out.push({ id: v.videoId, title: text(v.title), channel: text(v.ownerText) || text(v.longBylineText) })
    if (k === 'lockupViewModel' && v.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && v.contentId)
      out.push({ id: v.contentId, title: text(v.metadata?.lockupMetadataViewModel?.title), channel: (v.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || []).flatMap((r: any) => r.metadataParts || []).map((p: any) => text(p.text)).find((t: string) => t && !/views|visninger|ago|siden/i.test(t)) })
    if (k === 'continuationCommand' && v.token) next = v.token
  })
  return next
}

async function playlist(id: string): Promise<Video[]> {
  const out: Video[] = []
  const first = await api('browse', { browseId: 'VL' + id })
  let token = collectVideos(first, out)
  if (!out.length) throw new Error(`tom playliste; svarets nøgler: ${Object.keys(first || {}).join(', ')}; alert: ${JSON.stringify(first?.alerts || '').slice(0, 200)}`)
  for (let i = 0; token && i < 20; i++) token = collectVideos(await api('browse', { continuation: token }), out)
  return out
}

async function channelPlaylists(handle: string): Promise<{ id: string; title: string }[]> {
  const r = await fetch(`https://www.youtube.com/youtubei/v1/navigation/resolve_url?prettyPrint=false`, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: { client: CLIENT }, url: `https://www.youtube.com/${handle}` }),
    signal: AbortSignal.timeout(20000),
  })
  const browseId = (await r.json())?.endpoint?.browseEndpoint?.browseId
  if (!browseId) throw new Error(`kunne ikke slå ${handle} op`)
  const out: { id: string; title: string }[] = []
  // "EglwbGF5bGlzdHPyBgQKAkIA" is the params value for a channel's Playlists tab.
  let data = await api('browse', { browseId, params: 'EglwbGF5bGlzdHPyBgQKAkIA' })
  for (let i = 0; data && i < 10; i++) {
    let next: string | null = null
    walk(data, (k, v) => {
      if ((k === 'gridPlaylistRenderer' || k === 'playlistRenderer') && v.playlistId) out.push({ id: v.playlistId, title: text(v.title) })
      if (k === 'lockupViewModel' && v.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST') out.push({ id: v.contentId, title: text(v.metadata?.lockupMetadataViewModel?.title) })
      if (k === 'continuationCommand' && v.token) next = v.token
    })
    data = next ? await api('browse', { continuation: next }) : null
  }
  return out
}

/** oEmbed answers 401 when the uploader has turned off embedding. */
async function embeddable(id: string): Promise<boolean | undefined> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`, { signal: AbortSignal.timeout(15000) })
    return r.ok ? true : r.status === 401 ? false : undefined
  } catch {
    return undefined
  }
}

async function search(q: string): Promise<(Video & { embeddable?: boolean })[]> {
  const out: Video[] = []
  collectVideos(await api('search', { query: q }), out)
  return Promise.all(out.slice(0, 6).map(async (v) => ({ ...v, embeddable: await embeddable(v.id) })))
}

/** "Start Learning Logic | Part 3" is titled "Start Learning Logic 3 | …" on YouTube. */
function seriesQuery(title: string): string | undefined {
  const m = /^Start Learning (\w+) \| Part (\d+)/.exec(title)
  return m ? `"Start Learning ${m[1] === "Complex" ? "Complex Numbers" : m[1]} ${m[2]}" The Bright Side of Mathematics` : undefined
}

async function main() {
  const report: any = { generatedAt: new Date().toISOString(), playlists: {}, searches: [] as any[], errors: [] as string[] }
  const safe = async <T,>(label: string, f: () => Promise<T>) => {
    try {
      return await f()
    } catch (e) {
      report.errors.push(`${label}: ${(e as Error).message}`)
      return null
    }
  }
  for (const [name, id] of Object.entries(PLAYLISTS)) report.playlists[name] = (await safe(name, () => playlist(id))) || []
  for (const url of CHANNELS) {
    const lists = (await safe(url, () => channelPlaylists(url))) || []
    for (const l of lists.filter((x) => SERIES.test(x.title))) report.playlists[`${l.title} [${l.id}]`] = (await safe(l.title, () => playlist(l.id))) || []
  }
  const dir = join(ROOT, 'content/courses')
  const verified = join(ROOT, 'reports/videos.json')
  const notEmbeddable = new Set<string>(existsSync(verified) ? JSON.parse(readFileSync(verified, 'utf8')).rows.filter((r: any) => r.status === 'not-embeddable').map((r: any) => r.id) : [])
  for (const course of readdirSync(dir)) {
    const f = join(dir, course, 'videos.yaml')
    if (!existsSync(f)) continue
    const data = YAML.parse(readFileSync(f, 'utf8')) || {}
    for (const [key, entry] of Object.entries<any>(data.videos || {}))
      for (const [i, s] of (entry.sources || []).entries()) {
        // A video that can't be embedded may have an embeddable re-upload by the same channel.
        const blocked = s.youtube && notEmbeddable.has(s.youtube)
        if ((s.youtube && !blocked) || s.access === 'steady' || entry.remove) continue
        const q = blocked ? `${s.title.replace(/\|\s*Part\s*/i, '')} ${s.channel || ''} dark version` : seriesQuery(s.title) || s.search || `${s.title} ${s.channel || ''}`
        report.searches.push({ course, key, index: i, title: s.title, ...(blocked ? { replaces: s.youtube } : {}), query: q, results: (await safe(q, () => search(q))) || [] })
      }
  }
  mkdirSync(join(ROOT, 'reports'), { recursive: true })
  writeFileSync(join(ROOT, 'reports/video-candidates.json'), JSON.stringify(report, null, 1))
  console.log(`Playlister: ${Object.keys(report.playlists).length}, søgninger: ${report.searches.length}, fejl: ${report.errors.length}`)
}

if (process.argv[1]?.endsWith('find-videos.ts')) main()
