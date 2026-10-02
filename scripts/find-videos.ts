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
const CHANNELS = ['https://www.youtube.com/@brightsideofmaths/playlists', 'https://www.youtube.com/@TrevTutor/playlists']
const SERIES = /start learning|discrete math/i

interface Video {
  id: string
  title: string
  channel?: string
}

function initialData(html: string): any {
  const m = /var ytInitialData = (\{.*?\});<\/script>/s.exec(html) || /ytInitialData"\]\s*=\s*(\{.*?\});/s.exec(html)
  return m ? JSON.parse(m[1]) : null
}
const text = (t: any): string => (t?.simpleText ?? t?.runs?.map((r: any) => r.text).join('') ?? t?.content ?? '') as string

function walk(o: any, fn: (k: string, v: any) => void) {
  if (!o || typeof o !== 'object') return
  for (const [k, v] of Object.entries(o)) {
    fn(k, v)
    walk(v, fn)
  }
}

async function getHtml(url: string) {
  const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.text()
}

async function continuation(token: string, clientVersion: string) {
  const r = await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion, hl: 'en' } }, continuation: token }),
    signal: AbortSignal.timeout(20000),
  })
  return r.ok ? r.json() : null
}

function collectVideos(data: any, out: Video[]): string | null {
  let next: string | null = null
  walk(data, (k, v) => {
    if (k === 'playlistVideoRenderer' && v.videoId) out.push({ id: v.videoId, title: text(v.title), channel: text(v.shortBylineText) })
    if (k === 'videoRenderer' && v.videoId) out.push({ id: v.videoId, title: text(v.title), channel: text(v.ownerText) || text(v.longBylineText) })
    if (k === 'continuationCommand' && v.token) next = v.token
  })
  return next
}

async function playlist(id: string): Promise<Video[]> {
  const html = await getHtml(`https://www.youtube.com/playlist?list=${id}&hl=en`)
  const version = /"INNERTUBE_CLIENT_VERSION":"([^"]+)"/.exec(html)?.[1] || '2.20240101.00.00'
  const out: Video[] = []
  let token = collectVideos(initialData(html), out)
  for (let i = 0; token && i < 20; i++) {
    const data = await continuation(token, version)
    if (!data) break
    token = collectVideos(data, out)
  }
  return out
}

async function channelPlaylists(url: string): Promise<{ id: string; title: string }[]> {
  const data = initialData(await getHtml(url + '?hl=en'))
  const out: { id: string; title: string }[] = []
  walk(data, (k, v) => {
    if ((k === 'gridPlaylistRenderer' || k === 'playlistRenderer') && v.playlistId) out.push({ id: v.playlistId, title: text(v.title) })
    if (k === 'lockupViewModel' && v.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST') out.push({ id: v.contentId, title: text(v.metadata?.lockupMetadataViewModel?.title) })
  })
  return out
}

async function search(q: string): Promise<Video[]> {
  const out: Video[] = []
  collectVideos(initialData(await getHtml(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en`)), out)
  return out.slice(0, 6)
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
  for (const course of readdirSync(dir)) {
    const f = join(dir, course, 'videos.yaml')
    if (!existsSync(f)) continue
    const data = YAML.parse(readFileSync(f, 'utf8')) || {}
    for (const [key, entry] of Object.entries<any>(data.videos || {}))
      for (const [i, s] of (entry.sources || []).entries()) {
        if (s.youtube) continue
        const q = s.search || `${s.title} ${s.channel || ''}`
        report.searches.push({ course, key, index: i, title: s.title, query: q, results: (await safe(q, () => search(q))) || [] })
      }
  }
  mkdirSync(join(ROOT, 'reports'), { recursive: true })
  writeFileSync(join(ROOT, 'reports/video-candidates.json'), JSON.stringify(report, null, 1))
  console.log(`Playlister: ${Object.keys(report.playlists).length}, søgninger: ${report.searches.length}, fejl: ${report.errors.length}`)
}

if (process.argv[1]?.endsWith('find-videos.ts')) main()
