// One short auto-checked question (a week's "Tjek dig selv" quiz or a
// generated exercise) with instant feedback. Used by the placement test,
// "Ugens test" and the small questions between lesson steps.

import { useMemo } from 'react'
import { recordAttempt, useSetting, useStore } from '@/lib/store'
import { generatorById } from '@/lib/generators'
import { ANSWER_PREF_KEY, answerFormat, type AnswerPref } from '@/lib/answer-type'
import { choiceCheck } from '@/lib/choices'
import type { PlacementQuestion } from '@/lib/placement'
import type { Exercise } from '@/types/content'
import { AnswerInput, fromGenerated } from './ExerciseCard'
import { Html } from './Html'

/** What a question shows: a week's quiz or a generated exercise. */
export function questionView(q: PlacementQuestion, quizById: Map<string, Exercise>) {
  if (q.kind === 'quiz') return { kind: 'quiz' as const, exercise: quizById.get(q.exerciseId)! }
  const g = generatorById.get(q.generatorId)!
  const d = g.difficulties.includes(q.difficulty) ? q.difficulty : g.difficulties[0]
  return { kind: 'generated' as const, ex: fromGenerated(g, q.seed, d) }
}

export function QuickQuestion({ q, quizById, onAnswered, silent }: { q: PlacementQuestion; quizById: Map<string, Exercise>; onAnswered: (correct: boolean, answer: string) => void; silent?: boolean }) {
  const store = useStore()
  const [pref] = useSetting<AnswerPref>(ANSWER_PREF_KEY, 'blandet')
  const view = useMemo(() => questionView(q, quizById), [q, quizById])

  const save = async (ok: boolean, answer: string) => {
    if (view.kind === 'quiz') {
      const e = view.exercise
      await recordAttempt(store, { exerciseId: e.id, course: e.course, week: e.week, topics: e.topics, difficulty: e.difficulty, source: 'bank', score: ok ? 1 : 0, auto: true, answer }, ok ? 3 : 0)
    } else {
      const g = view.ex
      await recordAttempt(store, { exerciseId: g.id, course: g.course, week: q.week, topics: g.topics, difficulty: g.difficulty, source: 'generated', generatorId: g.generatorId, seed: g.seed, score: ok ? 1 : 0, auto: true, answer })
    }
    onAnswered(ok, answer)
  }

  if (view.kind === 'quiz') {
    const quiz = view.exercise.quiz!
    return (
      <div className="space-y-3">
        <Html html={quiz.question} className="reading" />
        <AnswerInput
          check={quiz.check || choiceCheck(quiz.choices!)}
          choices={quiz.choices}
          format={answerFormat({ choices: !!quiz.choices, typed: !!quiz.check }, pref, view.exercise.id)}
          explainHtml={quiz.explain}
          onChecked={(r, v) => save(r.correct, v)}
          silent={silent}
        />
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <Html html={view.ex.promptHtml} className="reading" />
      <AnswerInput
        check={view.ex.check!}
        choices={view.ex.choices}
        format={answerFormat({ choices: !!view.ex.choices, typed: view.ex.check!.type !== 'choice' }, pref, view.ex.id)}
        explainHtml={view.ex.solutionHtml}
        onChecked={(r, v) => save(r.correct, v)}
        silent={silent}
      />
    </div>
  )
}
