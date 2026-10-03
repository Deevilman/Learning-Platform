// Read and write course files (content/courses/<slug>.md) from Node scripts,
// keeping YAML comments and the plan body exactly as they are.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yaml'

export interface PackFile {
  path: string
  slug: string
  fm: YAML.Document
  body: string // everything after the closing "---" line (starts with "\n")
}

export function readPack(path: string): PackFile {
  const text = readFileSync(path, 'utf8')
  const m = /^---\n([\s\S]*?)\n---(\n[\s\S]*)$/.exec(text)
  if (!m) throw new Error(`${path}: mangler front matter`)
  const fm = YAML.parseDocument(m[1])
  return { path, slug: String(fm.get('slug')), fm, body: m[2] }
}

export function writePack(p: PackFile, body = p.body) {
  writeFileSync(p.path, `---\n${p.fm.toString({ lineWidth: 0, indentSeq: false }).trimEnd()}\n---${body}`)
}

/** Every course file in content/courses (folders are not included). */
export function listPacks(root: string): PackFile[] {
  const dir = join(root, 'content/courses')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
    .sort()
    .map((f) => readPack(join(dir, f)))
}

/** Video map (key → { sources }) of every course, from course files and from legacy videos.yaml folders. */
export function allCourseVideos(root: string): { course: string; videos: Record<string, any> }[] {
  const out = listPacks(root).map((p) => ({ course: p.slug, videos: (p.fm.toJS().videos as Record<string, any>) || {} }))
  const dir = join(root, 'content/courses')
  for (const d of readdirSync(dir, { withFileTypes: true }))
    if (d.isDirectory() && existsSync(join(dir, d.name, 'videos.yaml'))) out.push({ course: d.name, videos: YAML.parse(readFileSync(join(dir, d.name, 'videos.yaml'), 'utf8'))?.videos || {} })
  return out
}
