import type { CourseData, Exercise } from '@/types/content'
import { generators as allGenerators, type Generator } from './generators'
import type { WeekPool } from './placement'

/** Generators whose topics are taught in this week. */
export function weekGenerators(course: CourseData, week: number, gens: Generator[] = allGenerators): Generator[] {
  return gens.filter((g) => g.course === course.meta.slug && g.topics.some((t) => course.meta.topics.find((x) => x.id === t)?.weeks.includes(week)))
}

/** Auto-checked questions available for a week: its "Tjek dig selv" quizzes and its generators. */
export function weekPool(course: CourseData, week: number, exercises: Exercise[], gens: Generator[] = allGenerators): WeekPool {
  return {
    week,
    quizzes: exercises.filter((e) => e.quiz).map((e) => ({ exerciseId: e.id, difficulty: e.difficulty })),
    generators: weekGenerators(course, week, gens).map((g) => ({ id: g.id, difficulties: g.difficulties })),
  }
}
