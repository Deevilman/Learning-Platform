// A course as one file ("kursuspakke"): YAML front matter with the course's
// metadata, topics and videos, then the plan in the usual template. Fenced
// blocks ```lesson, ```opgaveskabelon, ```problem and ```challenge are taken
// out of the plan (their lines are blanked, so line numbers stay true).
// Pure: used by the content build and by the upload page in the browser.

import YAML from 'yaml'
import type { BuildError, CourseSource, Overrides } from './course-build.ts'

export const BLOCK_KINDS = ['lesson', 'opgaveskabelon', 'problem', 'challenge'] as const
export type BlockKind = (typeof BLOCK_KINDS)[number]

export interface PackBlock {
  kind: BlockKind
  line: number // line of the opening fence (1-based)
  data: any // parsed YAML
}

export interface CoursePack {
  source?: CourseSource
  blocks: PackBlock[]
  errors: BuildError[]
  warnings: string[]
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}$/
const COLOR_RE = /^#[0-9a-fA-F]{6}$/
const YT_RE = /^[\w-]{11}$/

/** Field rules for the front matter (mirrored by content/course-pack.schema.json). */
export const REQUIRED_FIELDS = ['slug', 'lang', 'title', 'topics'] as const

function yamlError(e: unknown, offset: number, file: string): BuildError {
  const err = e as { message?: string; linePos?: { line: number }[] }
  const line = (err.linePos?.[0]?.line || 0) + offset
  const msg = String(err.message || e).split('\n')[0].replace(/ at line \d+, column \d+:?$/, '')
  return { file, line, message: `YAML kunne ikke læses: ${msg}` }
}

/** Turn the front matter's video list (or map) into the build's key → { sources } map. */
function videosFrom(v: unknown, file: string, line: number, errors: BuildError[]): Record<string, any> {
  if (!v) return {}
  if (!Array.isArray(v)) return v as Record<string, any> // already the map form of videos.yaml
  const map: Record<string, any> = {}
  v.forEach((item: any, i) => {
    const where = `videos[${i}]`
    if (!item || typeof item !== 'object' || !item.key) return errors.push({ file, line, message: `${where}: hver video skal have en "key", der matcher planen` })
    if (item.remove) return void (map[item.key] = { key: item.key, remove: true })
    if (item.youtube && !YT_RE.test(String(item.youtube))) errors.push({ file, line, message: `${where} (${item.key}): "${item.youtube}" ligner ikke et YouTube-ID (11 tegn)` })
    if (item.access && item.access !== 'steady') errors.push({ file, line, message: `${where} (${item.key}): "access" kan kun være "steady"` })
    if (item.access === 'steady' && !/^https:\/\//.test(item.url || '')) errors.push({ file, line, message: `${where} (${item.key}): "access: steady" kræver et https-link i "url"` })
    if (!item.youtube && !item.access && !item.search && !item.sources) errors.push({ file, line, message: `${where} (${item.key}): angiv "youtube", "access: steady" eller "search"` })
    const entry = (map[item.key] ||= { key: item.key, sources: [] })
    if (item.sources) entry.sources.push(...item.sources)
    else entry.sources.push({ title: item.title || '', channel: item.channel, youtube: item.youtube, search: item.search, embed: item.embed, access: item.access, url: item.url })
    if (item.links) entry.links = item.links
  })
  return map
}

export function parseCoursePack(text: string, file: string): CoursePack {
  const errors: BuildError[] = []
  const warnings: string[] = []
  const blocks: PackBlock[] = []
  const src = text.replace(/\r\n/g, '\n').replace(/^﻿/, '')
  const lines = src.split('\n')
  if (lines[0].trim() !== '---') return { blocks, warnings, errors: [{ file, line: 1, message: 'Filen skal starte med "---" og en YAML-blok med kursets oplysninger (front matter).' }] }
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
  if (end < 0) return { blocks, warnings, errors: [{ file, line: 1, message: 'Front matter slutter ikke: der mangler en linje med "---".' }] }

  let fm: any
  try {
    fm = YAML.parse(lines.slice(1, end).join('\n')) || {}
  } catch (e) {
    return { blocks, warnings, errors: [yamlError(e, 1, file)] }
  }
  const fmLine = (key: string) => {
    const i = lines.slice(1, end).findIndex((l) => l.startsWith(`${key}:`))
    return i < 0 ? 1 : i + 2
  }

  // ---------- front matter checks
  for (const f of REQUIRED_FIELDS) if (fm[f] === undefined) errors.push({ file, line: 1, message: `Front matter mangler "${f}".` })
  if (fm.slug !== undefined && !SLUG_RE.test(String(fm.slug))) errors.push({ file, line: fmLine('slug'), message: `"slug" må kun indeholde små bogstaver, tal og bindestreg (fx "kemi-a"), fandt "${fm.slug}".` })
  if (fm.lang !== undefined && !['da', 'en'].includes(fm.lang)) errors.push({ file, line: fmLine('lang'), message: `"lang" skal være "da" eller "en".` })
  if (fm.color !== undefined && !COLOR_RE.test(String(fm.color))) errors.push({ file, line: fmLine('color'), message: `"color" skal være en farve som "#2563eb".` })
  if (fm.exam !== undefined && !['htx', 'olympiade'].includes(fm.exam)) errors.push({ file, line: fmLine('exam'), message: `"exam" kan være "htx" eller "olympiade".` })
  for (const k of ['requires', 'recommended_before', 'next'])
    if (fm[k] !== undefined && !(Array.isArray(fm[k]) && fm[k].every((x: unknown) => typeof x === 'string'))) errors.push({ file, line: fmLine(k), message: `"${k}" skal være en liste af kursus-slugs.` })
  if (fm.topics !== undefined) {
    if (!Array.isArray(fm.topics) || !fm.topics.length) errors.push({ file, line: fmLine('topics'), message: '"topics" skal være en liste med mindst ét emne.' })
    else
      fm.topics.forEach((t: any, i: number) => {
        if (!t?.id || !t?.name) errors.push({ file, line: fmLine('topics'), message: `topics[${i}]: hvert emne skal have "id" og "name".` })
        if (!Array.isArray(t?.weeks) || !t.weeks.every((w: unknown) => Number.isInteger(w))) errors.push({ file, line: fmLine('topics'), message: `topics[${i}] (${t?.id}): "weeks" skal være en liste af ugenumre.` })
      })
  }
  const videos = videosFrom(fm.videos, file, fmLine('videos'), errors)

  // ---------- body: take out the special blocks, keep line numbers
  const body = lines.map((l, i) => (i <= end ? '' : l))
  let open: { kind: BlockKind; start: number; fence: string } | null = null
  for (let i = end + 1; i < body.length; i++) {
    const l = body[i]
    if (!open) {
      const m = /^(\s*)(`{3,}|~{3,})\s*([\w-]+)\s*$/.exec(l)
      if (m && (BLOCK_KINDS as readonly string[]).includes(m[3])) open = { kind: m[3] as BlockKind, start: i, fence: m[2] }
      continue
    }
    if (l.trim() === open.fence || (l.trim().startsWith(open.fence) && /^[`~]+$/.test(l.trim()))) {
      const yamlText = body.slice(open.start + 1, i).join('\n')
      try {
        blocks.push({ kind: open.kind, line: open.start + 1, data: YAML.parse(yamlText) })
      } catch (e) {
        errors.push(yamlError(e, open.start + 1, file))
      }
      for (let k = open.start; k <= i; k++) body[k] = ''
      open = null
    }
  }
  if (open) errors.push({ file, line: open.start + 1, message: `Blokken "${open.kind}" bliver ikke lukket med ${open.fence}.` })

  const plan = body.join('\n')
  if (!plan.trim()) errors.push({ file, line: end + 2, message: 'Der er ingen plan efter front matter (uger, videoer, noter og øvelser).' })
  if (!fm.slug || !SLUG_RE.test(String(fm.slug))) return { blocks, warnings, errors }

  const meta = { ...fm }
  delete meta.videos
  delete meta.overrides
  delete meta.forward_refs
  return {
    source: {
      slug: String(fm.slug),
      meta,
      plan,
      overrides: (fm.overrides || {}) as Overrides,
      videos,
      forwardRefs: fm.forward_refs || {},
      files: { meta: file, plan: file, overrides: file, videos: file, forwardRefs: file },
    },
    blocks,
    errors,
    warnings,
  }
}
