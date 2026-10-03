import { describe, expect, it } from 'vitest'
import { nextProblem, problemStatus } from '@/lib/code-problems'
import type { CodeProblem } from '@/types/content'
import type { Attempt, SubmissionRec } from '@/lib/storage/types'

const prob = (id: string, difficulty: 1 | 2 | 3, topics: string[]): CodeProblem => ({ id, course: 'c', title: id, difficulty, topics, languages: ['python'], timeLimit: 1, memoryLimit: 64, statementHtml: '', publicTests: [], hiddenCount: 1, hintsHtml: [], editorialHtml: '', starter: {} })
const sub = (problemId: string, verdict: SubmissionRec['verdict']): SubmissionRec => ({ id: problemId + verdict, problemId, course: 'c', language: 'python', verdict, passed: 0, total: 1, code: '', ts: 1, updatedAt: 1 })
const att = (topic: string, score: number): Attempt => ({ id: topic + score, exerciseId: 'x', course: 'c', week: 1, topics: [topic], difficulty: 1, score, source: 'bank', ts: 1, updatedAt: 1 })

describe('coding problems in the app', () => {
  const problems = [prob('a', 2, ['loops']), prob('b', 1, ['loops']), prob('c', 1, ['strings']), prob('d', 3, ['strings'])]
  it('status comes from the submissions', () => {
    expect(problemStatus('a', [sub('a', 'WA')])).toBe('tried')
    expect(problemStatus('a', [sub('a', 'WA'), sub('a', 'AC')])).toBe('solved')
    expect(problemStatus('b', [sub('a', 'AC')])).toBe('new')
  })
  it('"Næste opgave": unfinished first, then the weakest topic, then the easiest', () => {
    const strong = [att('loops', 1), att('loops', 1), att('loops', 1), att('strings', 0)]
    expect(nextProblem(problems, [], strong, 2)!.id).toBe('c') // strings is weaker → easiest strings problem
    expect(nextProblem(problems, [sub('d', 'WA')], strong, 2)!.id).toBe('d') // tried and not solved comes first
    expect(nextProblem(problems, ['a', 'b', 'c', 'd'].map((x) => sub(x, 'AC')), strong, 2)).toBeUndefined()
  })
})
