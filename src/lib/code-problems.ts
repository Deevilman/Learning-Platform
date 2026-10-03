// Coding problems in the app: status per problem from the submission history,
// and "Næste opgave" from the mastery model (weakest topic first, easiest
// unsolved problem in it).

import type { CodeProblem } from '@/types/content'
import type { Attempt, SubmissionRec } from './storage/types'
import { computeMastery } from './mastery'

export type ProblemStatus = 'solved' | 'tried' | 'new'

export const codeAttemptId = (problemId: string) => `code:${problemId}`

export function problemStatus(id: string, subs: SubmissionRec[]): ProblemStatus {
  const mine = subs.filter((s) => s.problemId === id && !s.deleted)
  return mine.some((s) => s.verdict === 'AC') ? 'solved' : mine.length ? 'tried' : 'new'
}

export function nextProblem(problems: CodeProblem[], subs: SubmissionRec[], attempts: Attempt[], now: number): CodeProblem | undefined {
  const open = problems.filter((p) => problemStatus(p.id, subs) !== 'solved')
  if (!open.length) return undefined
  const topicScore = (course: string, topic: string) => computeMastery(attempts.filter((a) => a.course === course && a.topics.includes(topic)), now).mastery
  const score = (p: CodeProblem) => Math.min(...p.topics.map((t) => topicScore(p.course, t)))
  // tried-but-unsolved first (unfinished business), then weakest topic, then easiest
  return [...open].sort((a, b) => Number(problemStatus(b.id, subs) === 'tried') - Number(problemStatus(a.id, subs) === 'tried') || score(a) - score(b) || a.difficulty - b.difficulty || a.id.localeCompare(b.id))[0]
}
