import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  answerPlacement,
  continuePlacement,
  currentQuestion,
  placementResults,
  questionsForWeek,
  startPlacement,
  startWeek,
  totalQuestions,
  weekVerdict,
  type WeekPool,
} from '@/lib/placement'
import { generators, registerGenerators } from '@/lib/generators'
import { templateToGenerator, type TemplateDef } from '@/lib/templates'
import type { CourseMeta } from '@/types/content'

const pool = (week: number, quizzes = 2, gens = 1): WeekPool => ({
  week,
  quizzes: Array.from({ length: quizzes }, (_, i) => ({ exerciseId: `c/${week}/${week}.${i + 1}`, difficulty: ((i % 3) + 1) as 1 | 2 | 3 })),
  generators: Array.from({ length: gens }, (_, i) => ({ id: `g${week}-${i}`, difficulties: [1, 2, 3] })),
})

describe('placement questions', () => {
  it('asks at most three per week, easy to hard, mixing the week’s quizzes and generated questions', () => {
    const qs = questionsForWeek(pool(4, 3, 2), 1)
    expect(qs).toHaveLength(3)
    expect(qs.map((q) => q.difficulty)).toEqual([...qs.map((q) => q.difficulty)].sort())
    expect(qs.some((q) => q.kind === 'quiz')).toBe(true)
    expect(qs.some((q) => q.kind === 'generated')).toBe(true)
  })
  it('works with only generators or only quizzes, and with none', () => {
    expect(questionsForWeek(pool(1, 0, 1), 1)).toHaveLength(3)
    expect(questionsForWeek(pool(1, 2, 0), 1)).toHaveLength(2)
    expect(questionsForWeek(pool(1, 0, 0), 1)).toHaveLength(0)
  })
})

describe('placement flow', () => {
  it('stops a week early when the result is clear', () => {
    expect(weekVerdict([true, true], 3)).toBe('known')
    expect(weekVerdict([false, false], 3)).toBe('unknown')
    expect(weekVerdict([true, false], 3)).toBeNull()
    expect(weekVerdict([true, false, true], 3)).toBe('known')
    expect(weekVerdict([true], 1)).toBe('known')
  })

  it('marks known weeks, starts at the first week not known, and stops after two unknown weeks in a row', () => {
    let s = startPlacement([1, 2, 3, 4, 5, 6].map((w) => pool(w)), 7)
    const script: Record<number, boolean[]> = { 1: [true, true], 2: [true, false, true], 3: [false, false], 4: [true, true], 5: [false, true, false], 6: [true, true] }
    while (!s.finished) {
      const q = currentQuestion(s)!
      const done = (s.answers[q.week] || []).length
      s = answerPlacement(s, script[q.week][done])
    }
    // week 3 and 5 unknown, but not in a row → the test runs to the end
    expect(s.stoppedEarly).toBe(false)
    const r = placementResults(s)
    expect(r).toEqual({ 1: 'known', 2: 'known', 3: 'unknown', 4: 'known', 5: 'unknown', 6: 'known' })
    expect(startWeek(r, s.weeks)).toBe(3)
    expect(totalQuestions(s)).toBe(2 + 3 + 2 + 2 + 3 + 2)
  })

  it('stops after two unknown weeks in a row and can continue', () => {
    let s = startPlacement([1, 2, 3, 4].map((w) => pool(w)), 3)
    for (let i = 0; i < 4; i++) s = answerPlacement(s, false) // weeks 1 and 2 wrong, wrong
    expect(s.finished).toBe(true)
    expect(s.stoppedEarly).toBe(true)
    expect(placementResults(s)[3]).toBe('untested')
    expect(startWeek(placementResults(s), s.weeks)).toBe(1)
    s = continuePlacement(s)
    expect(currentQuestion(s)!.week).toBe(3)
  })

  it('skips weeks without questions', () => {
    let s = startPlacement([pool(1, 0, 0), pool(2)], 1)
    expect(currentQuestion(s)!.week).toBe(2)
    s = answerPlacement(answerPlacement(s, true), true)
    expect(s.finished).toBe(true)
    expect(placementResults(s)).toEqual({ 1: 'untested', 2: 'known' })
  })
})

describe('placement coverage of the real courses', () => {
  const idx = JSON.parse(readFileSync(join(import.meta.dirname, '../../public/data/index.json'), 'utf8')) as { courses: CourseMeta[]; templates?: TemplateDef[] }
  registerGenerators((idx.templates || []).map((t) => templateToGenerator(t, t.kursus || '')))
  for (const c of idx.courses)
    it(`${c.slug}: every week has at least two auto-checked questions`, () => {
      const course = JSON.parse(readFileSync(join(import.meta.dirname, `../../public/data/courses/${c.slug}.json`), 'utf8'))
      for (const w of course.weeks as { number: number }[]) {
        const week = JSON.parse(readFileSync(join(import.meta.dirname, `../../public/data/courses/${c.slug}/week-${w.number}.json`), 'utf8'))
        const quizzes = week.exercises.filter((e: { quiz?: unknown }) => e.quiz).length
        const gens = generators.filter((g) => g.course === c.slug && g.topics.some((t) => c.topics.find((x) => x.id === t)?.weeks.includes(w.number))).length
        const n = questionsForWeek({ week: w.number, quizzes: Array(quizzes).fill({ exerciseId: 'x', difficulty: 1 }), generators: Array.from({ length: gens }, (_, i) => ({ id: `g${i}`, difficulties: [1, 2] })) }, 1).length
        expect(n, `${c.slug} uge ${w.number}`).toBeGreaterThanOrEqual(2)
      }
    })
})
