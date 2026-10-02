// Loads the JSON produced by `npm run content` (lazily, cached).

import type { ContentIndex, CourseData, ExerciseSet, SearchDoc, Week, Exercise } from '@/types/content'

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/') + 'data/'
const cache = new Map<string, Promise<unknown>>()

function load<T>(path: string): Promise<T> {
  let p = cache.get(path)
  if (!p) {
    p = fetch(base + path).then((r) => {
      if (!r.ok) throw new Error(`Kunne ikke hente ${path} (${r.status})`)
      return r.json()
    })
    p.catch(() => cache.delete(path))
    cache.set(path, p)
  }
  return p as Promise<T>
}

export const loadIndex = () => load<ContentIndex>('index.json')
export const loadCourse = (slug: string) => load<CourseData>(`courses/${slug}.json`)
export const loadWeek = (slug: string, n: number) => load<Week>(`courses/${slug}/week-${n}.json`)
export const loadSet = (slug: string, set: string) => load<ExerciseSet>(`courses/${slug}/set-${set}.json`)
export const loadSearch = () => load<SearchDoc[]>('search.json')

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
