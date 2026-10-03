// Loads the JSON produced by `npm run content` (lazily, cached), merged with
// the courses the learner has added in the app (IndexedDB). An added course
// with the same slug as one of the site's replaces it.

import { registerGenerators } from './generators'
import { templateToGenerator } from './templates'
import { currentLang, tr } from '@/i18n/translate'
import type { ContentIndex, CourseData, ExerciseSet, SearchDoc, Week, Exercise } from '@/types/content'
import { onCoursesChanged, visibleBuilds, type StoredBuild } from './courses/store'

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/') + 'data/'
const cache = new Map<string, Promise<unknown>>()

/** Path prefix of a course in the current language: "courses/quant" or "courses/quant.en". */
async function coursePath(slug: string): Promise<string> {
  // the learner's language: a course written in it (<slug>.<lang>.json) is loaded instead of the main version
  const lang = currentLang()
  const meta = (await loadIndex()).courses.find((c) => c.slug === slug)
  return meta && meta.lang !== lang && meta.langs?.includes(lang) ? `courses/${slug}.${lang}` : `courses/${slug}`
}

function load<T>(path: string): Promise<T> {
  let p = cache.get(path)
  if (!p) {
    p = fetch(base + path).then((r) => {
      if (!r.ok) throw new Error(tr('error.load', { status: r.status }))
      return r.json()
    })
    p.catch(() => cache.delete(path))
    cache.set(path, p)
  }
  return p as Promise<T>
}

// ---------- the learner's own courses
let uploaded: Promise<Map<string, StoredBuild>> | null = null
function uploadedCourses(): Promise<Map<string, StoredBuild>> {
  if (!uploaded) {
    uploaded = (typeof indexedDB === 'undefined' ? Promise.resolve([]) : visibleBuilds())
      .then((list) => new Map(list.map((b) => [b.slug, b] as const)))
      .catch(() => new Map<string, StoredBuild>())
  }
  return uploaded
}
onCoursesChanged(() => {
  uploaded = null
})

export async function loadIndex(): Promise<ContentIndex> {
  const [site, own] = await Promise.all([load<ContentIndex>('index.json'), uploadedCourses()])
  if (!own.size) return withTemplates(site)
  const mine = [...own.values()].map((b) => b.data)
  return withTemplates({
    ...site,
    courses: [...site.courses.filter((c) => !own.has(c.slug)), ...mine.map((d) => ({ ...d.meta, uploaded: true }))],
    exercises: [...site.exercises.filter((e) => !own.has(e.course)), ...mine.flatMap((d) => d.summaries)],
    templates: [...(site.templates || []).filter((t) => !own.has(t.kursus || '')), ...mine.flatMap((d) => d.course.templates || [])],
  })
}

const templatesReady = () => loadIndex().catch(() => null)

/** Exercise templates become generators as soon as the index is known. */
function withTemplates(index: ContentIndex): ContentIndex {
  registerGenerators((index.templates || []).map((t) => templateToGenerator(t, t.kursus || '')))
  return index
}

export async function loadCourse(slug: string): Promise<CourseData> {
  await templatesReady() // week pages use the course's generators
  const own = (await uploadedCourses()).get(slug)
  return own ? { ...own.data.course, meta: { ...own.data.course.meta, uploaded: true } } : load<CourseData>(`${await coursePath(slug)}.json`)
}

export async function loadWeek(slug: string, n: number): Promise<Week> {
  const own = (await uploadedCourses()).get(slug)
  if (own) {
    const w = own.data.weeks.find((x) => x.number === n)
    if (!w) throw new Error(tr('error.noWeek', { n }))
    return w
  }
  return load<Week>(`${await coursePath(slug)}/week-${n}.json`)
}

export async function loadSet(slug: string, set: string): Promise<ExerciseSet> {
  const own = (await uploadedCourses()).get(slug)
  if (own) {
    const s = own.data.sets.find((x) => x.slug === set)
    if (!s) throw new Error(tr('error.noSet'))
    return s
  }
  return load<ExerciseSet>(`${await coursePath(slug)}/set-${set}.json`)
}

export async function loadSearch(): Promise<SearchDoc[]> {
  const [site, own] = await Promise.all([load<SearchDoc[]>('search.json'), uploadedCourses()])
  if (!own.size) return site
  return [...site.filter((d) => !own.has(d.course)), ...[...own.values()].flatMap((b) => b.data.search)]
}

/** Load a bank exercise by id ("quant/3/3.5" or "quant/selftest/4"). */
export async function loadExercise(id: string): Promise<Exercise | undefined> {
  const [course, week, number] = id.split('/')
  if (week === 'selftest' || week === 'interview') {
    const set = await loadSet(course, week)
    return set.exercises.find((e) => e.number === number)
  }
  const w = await loadWeek(course, Number(week))
  return w.exercises.find((e) => e.number === number)
}
