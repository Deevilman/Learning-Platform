// Cloud copy of the learner's own courses (Supabase): the course file in the
// private Storage bucket "courses" at <user id>/<slug>.md and one row per
// course in public.courses (RLS: owner only). Every device downloads new or
// changed courses and builds them locally.

import { getSession, supabase } from '../storage/supabase-sync'
import { getPack, listPacks, removeCourse, saveCourse, setHidden, type StoredPack } from './store'
import { loadIndex } from '../data'
import { tr } from '@/i18n/translate'

export interface CourseRow {
  slug: string
  title: string
  file_name: string
  hash: string
  hidden: boolean
  deleted: boolean
  updated_at: number
}

/** The part of the Supabase client this module uses (a fake one in tests). */
export interface CoursesClient {
  from(table: 'courses'): {
    select(cols: string): PromiseLike<{ data: CourseRow[] | null; error: { message: string } | null }>
    upsert(row: Partial<CourseRow> & { slug: string }, opts: { onConflict: string }): PromiseLike<{ error: { message: string } | null }>
  }
  storage: {
    from(bucket: 'courses'): {
      upload(path: string, body: Blob, opts: { upsert: boolean; contentType: string }): PromiseLike<{ error: { message: string } | null }>
      download(path: string): PromiseLike<{ data: Blob | null; error: { message: string } | null }>
      remove(paths: string[]): PromiseLike<{ error: { message: string } | null }>
    }
  }
}

const path = (userId: string, slug: string) => `${userId}/${slug}.md`

async function client(): Promise<{ sb: CoursesClient; userId: string } | null> {
  const session = await getSession().catch(() => null)
  if (!session) return null
  return { sb: (await supabase()) as unknown as CoursesClient, userId: session.user.id }
}

export async function pushCourseWith(sb: CoursesClient, userId: string, pack: Pick<StoredPack, 'slug' | 'title' | 'fileName' | 'text'> & { hash?: string; hidden?: boolean }) {
  const up = await sb.storage.from('courses').upload(path(userId, pack.slug), new Blob([pack.text], { type: 'text/markdown' }), { upsert: true, contentType: 'text/markdown' })
  if (up.error) throw new Error(up.error.message)
  const stored = await getPack(pack.slug)
  const row = { slug: pack.slug, title: pack.title, file_name: pack.fileName, hash: pack.hash || stored?.hash || '', hidden: pack.hidden ?? stored?.hidden ?? false, deleted: false, updated_at: stored?.updatedAt || Date.now() }
  const { error } = await sb.from('courses').upsert(row, { onConflict: 'owner,slug' })
  if (error) throw new Error(error.message)
}

/** Upload after "Tilføj". Returns a sentence for the learner. */
export async function pushCourse(pack: Pick<StoredPack, 'slug' | 'title' | 'fileName' | 'text'>): Promise<string> {
  const c = await client()
  if (!c) return tr('add.savedLocal')
  await pushCourseWith(c.sb, c.userId, pack)
  return tr('add.savedCloud')
}

export async function setCloudHidden(slug: string, hidden: boolean) {
  const c = await client()
  if (!c) return
  const p = await getPack(slug)
  await c.sb.from('courses').upsert({ slug, hidden, updated_at: p?.updatedAt || Date.now() }, { onConflict: 'owner,slug' })
}

export async function removeCloudCourse(slug: string) {
  const c = await client()
  if (!c) return
  await c.sb.from('courses').upsert({ slug, deleted: true, updated_at: Date.now() }, { onConflict: 'owner,slug' })
  await c.sb.storage.from('courses').remove([path(c.userId, slug)])
}

/**
 * Bring this device up to date: download courses that are new or changed in
 * the cloud and build them here; apply hide/delete; upload local courses the
 * cloud doesn't have yet. Newest change wins.
 */
export async function syncCoursesWith(sb: CoursesClient, userId: string, build: (text: string, fileName: string) => Promise<{ title: string; data: Parameters<typeof saveCourse>[1] } | { error: string }>) {
  const { data, error } = await sb.from('courses').select('slug,title,file_name,hash,hidden,deleted,updated_at')
  if (error) throw new Error(error.message)
  const rows = new Map((data || []).map((r) => [r.slug, r] as const))
  const local = new Map((await listPacks()).map((p) => [p.slug, p] as const))
  let pulled = 0
  let pushed = 0
  const problems: string[] = []
  for (const r of rows.values()) {
    const mine = local.get(r.slug)
    if (r.deleted) {
      if (mine && mine.updatedAt <= r.updated_at) await removeCourse(r.slug)
      continue
    }
    if (mine && mine.hash === r.hash) {
      if (mine.hidden !== r.hidden && r.updated_at > mine.updatedAt) await setHidden(r.slug, r.hidden)
      continue
    }
    if (mine && mine.updatedAt > r.updated_at) continue // the local one is newer: pushed below
    const file = await sb.storage.from('courses').download(path(userId, r.slug))
    if (file.error || !file.data) {
      problems.push(`${r.title}: ${file.error?.message || tr('add.fileMissing')}`)
      continue
    }
    const text = await file.data.text()
    const built = await build(text, r.file_name)
    if ('error' in built) {
      problems.push(`${r.title}: ${built.error}`)
      continue
    }
    await saveCourse({ slug: r.slug, fileName: r.file_name, text, title: built.title, hidden: r.hidden, updatedAt: r.updated_at }, built.data)
    pulled++
  }
  for (const p of local.values()) {
    const r = rows.get(p.slug)
    if (r && (r.deleted ? r.updated_at >= p.updatedAt : r.hash === p.hash || r.updated_at >= p.updatedAt)) continue
    await pushCourseWith(sb, userId, p)
    pushed++
  }
  return { pulled, pushed, problems }
}

/** Build a course file in this browser (used when another device added it). */
export async function buildForSync(text: string, fileName: string) {
  const [{ prepareCourse }, index] = await Promise.all([import('./builder'), loadIndex()])
  const p = prepareCourse(text, fileName, index)
  if (!p.build || p.errors.length) return { error: p.errors[0]?.message || tr('add.couldNotBuild') }
  const b = p.build
  return { title: b.meta.title, data: { meta: b.meta, course: b.course, weeks: b.weeks, sets: b.sets, summaries: b.summaries, search: b.search } }
}

export async function syncCourses() {
  const c = await client()
  if (!c) return null
  return syncCoursesWith(c.sb, c.userId, buildForSync)
}
