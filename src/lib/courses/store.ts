// Courses the learner has added ("Tilføj kursus"): the original course file
// and the built data, kept in IndexedDB so they work offline and load fast.
// The cloud copy (Supabase) lives in ./cloud.ts.

import Dexie, { type Table } from 'dexie'
import type { CourseBuild } from '../../../scripts/lib/course-build.ts'

export interface StoredPack {
  slug: string
  fileName: string
  text: string
  hash: string
  title: string
  hidden: boolean
  updatedAt: number
}

export interface StoredBuild {
  slug: string
  hash: string
  data: Pick<CourseBuild, 'meta' | 'course' | 'weeks' | 'sets' | 'summaries' | 'search'>
}

class CourseDB extends Dexie {
  packs!: Table<StoredPack, string>
  built!: Table<StoredBuild, string>
  constructor(name: string) {
    super(name)
    this.version(1).stores({ packs: '&slug, updatedAt', built: '&slug' })
  }
}

let db: CourseDB | null = null
const getDb = () => (db ||= new CourseDB('laering-kurser'))
/** Tests use their own database. */
export function useCourseDb(name: string) {
  db = new CourseDB(name)
}

const listeners = new Set<() => void>()
export function onCoursesChanged(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const changed = () => listeners.forEach((l) => l())

export async function hashText(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

export async function listPacks(): Promise<StoredPack[]> {
  return (await getDb().packs.toArray()).sort((a, b) => a.title.localeCompare(b.title))
}

export async function getPack(slug: string) {
  return getDb().packs.get(slug)
}

/** Built data for the visible uploaded courses. */
export async function visibleBuilds(): Promise<StoredBuild[]> {
  const packs = await getDb().packs.toArray()
  const visible = new Set(packs.filter((p) => !p.hidden).map((p) => p.slug))
  return (await getDb().built.toArray()).filter((b) => visible.has(b.slug))
}

export async function getBuild(slug: string): Promise<StoredBuild | undefined> {
  const p = await getDb().packs.get(slug)
  if (!p || p.hidden) return undefined
  return getDb().built.get(slug)
}

/** Save (or update) a course. Progress is kept: it is stored by course slug, exercise number and video key. */
export async function saveCourse(pack: Omit<StoredPack, 'hash' | 'updatedAt' | 'hidden'> & { hidden?: boolean; updatedAt?: number }, build: StoredBuild['data']) {
  const hash = await hashText(pack.text)
  const prev = await getDb().packs.get(pack.slug)
  await getDb().transaction('rw', getDb().packs, getDb().built, async () => {
    await getDb().packs.put({ ...pack, hash, hidden: pack.hidden ?? prev?.hidden ?? false, updatedAt: pack.updatedAt ?? Date.now() })
    await getDb().built.put({ slug: pack.slug, hash, data: build })
  })
  changed()
  return hash
}

export async function setHidden(slug: string, hidden: boolean) {
  await getDb().packs.update(slug, { hidden, updatedAt: Date.now() })
  changed()
}

export async function removeCourse(slug: string) {
  await getDb().transaction('rw', getDb().packs, getDb().built, async () => {
    await getDb().packs.delete(slug)
    await getDb().built.delete(slug)
  })
  changed()
}
