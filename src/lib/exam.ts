// Practice exams. HTX: two parts — "uden hjælpemidler" (easier, shorter) and
// "med hjælpemidler" — with a timer, answers shown only at the end, a score per
// exercise, a rough grade estimate on the 7-point scale and the topics to
// train. Olympiad: proof problems, scored by the learner against the solution.

import type { Difficulty } from '@/types/content'
import type { PlacementQuestion, WeekPool } from './placement'
import { makeRng } from './rng'

export interface ExamLength {
  id: 'kort' | 'fuld'
  minutes: [number, number]
  questions: [number, number]
}
export const EXAM_LENGTHS: ExamLength[] = [
  { id: 'kort', minutes: [15, 30], questions: [4, 6] },
  { id: 'fuld', minutes: [60, 240], questions: [10, 14] },
]

export interface ExamPart {
  aids: boolean // med hjælpemidler
  minutes: number
  questions: PlacementQuestion[]
}

/** Questions from every week: part 1 from difficulty 1–2, part 2 from 2–3; spread over the weeks. */
export function buildExam(pools: WeekPool[], seed: number, len: ExamLength): ExamPart[] {
  const rng = makeRng(seed)
  const all: PlacementQuestion[] = []
  for (const p of pools) {
    for (const q of p.quizzes) all.push({ kind: 'quiz', week: p.week, exerciseId: q.exerciseId, difficulty: q.difficulty })
    for (const g of p.generators) for (const d of g.difficulties) all.push({ kind: 'generated', week: p.week, generatorId: g.id, difficulty: d, seed: rng.int(1, 2 ** 30) })
  }
  const pick = (levels: Difficulty[], n: number, taken: Set<PlacementQuestion>) => {
    const cands = rng.shuffle(all.filter((q) => levels.includes(q.difficulty) && !taken.has(q)))
    // round-robin over weeks so the whole course is covered
    const byWeek = new Map<number, PlacementQuestion[]>()
    for (const q of cands) byWeek.set(q.week, [...(byWeek.get(q.week) || []), q])
    const weeks = [...byWeek.keys()].sort((a, b) => a - b)
    const out: PlacementQuestion[] = []
    while (out.length < n && weeks.some((w) => byWeek.get(w)!.length))
      for (const w of weeks) {
        const q = byWeek.get(w)!.shift()
        if (q && out.length < n) out.push(q), taken.add(q)
      }
    return out.sort((a, b) => a.difficulty - b.difficulty || a.week - b.week)
  }
  const taken = new Set<PlacementQuestion>()
  return [
    { aids: false, minutes: len.minutes[0], questions: pick([1, 2], len.questions[0], taken) },
    { aids: true, minutes: len.minutes[1], questions: pick([2, 3], len.questions[1], taken) },
  ]
}

/** A rough estimate on the 7-point scale from the share of points (not an official grade). */
export function gradeEstimate(share: number): '12' | '10' | '7' | '4' | '02' | '00' | '-3' {
  if (share >= 0.9) return '12'
  if (share >= 0.78) return '10'
  if (share >= 0.62) return '7'
  if (share >= 0.47) return '4'
  if (share >= 0.33) return '02'
  if (share >= 0.1) return '00'
  return '-3'
}

/** Topics with the most points lost first. */
export function topicsToTrain(results: { topics: string[]; points: number; max: number }[]): string[] {
  const lost = new Map<string, number>()
  for (const r of results) for (const t of r.topics) lost.set(t, (lost.get(t) || 0) + (r.max - r.points) / r.max)
  return [...lost.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([t]) => t)
}
