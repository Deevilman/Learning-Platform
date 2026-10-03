// The part of the week's notes that belongs to one video: used when the video
// can't be watched (Steady, missing), as the summary of a thin lesson, and as
// the answer to "Tjek om du forstår det" questions that have none of their own.

import { splitLesson, type LessonStep } from '@/lib/lesson'
import type { Lesson, LessonQuestion, VideoItem } from '@/types/content'

const plain = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ')
const STOP = new Set(['og', 'at', 'en', 'et', 'det', 'den', 'der', 'de', 'som', 'med', 'for', 'til', 'fra', 'af', 'på', 'i', 'er', 'om', 'hvad', 'hvordan', 'hvorfor', 'kan', 'man', 'du', 'the', 'and', 'of', 'to', 'a', 'in', 'is'])
/** Words, cut to a stem of 5 letters so "sandsynligheden" matches "sandsynlighed". */
const words = (s: string) =>
  plain(s)
    .toLowerCase()
    .split(/[^a-z0-9æøåäöü]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map((w) => w.slice(0, 5))

/** No source can be played here: every one is for Steady supporters or has no YouTube ID. */
export function videoUnavailable(item: VideoItem): boolean {
  return !item.sources.length || item.sources.every((s) => s.access === 'steady' || !s.youtube)
}

/** The notes step whose sub-heading best matches the video's Fokus (and title). */
export function notesForVideo(notesHtml: string, item: VideoItem, doc?: Document): LessonStep | undefined {
  if (!notesHtml.trim()) return undefined
  const want = new Set(words(`${item.focus || ''} ${item.title}`))
  if (!want.size) return undefined
  let best: LessonStep | undefined
  let bestScore = 0
  for (const step of splitLesson(notesHtml, doc)) {
    const score = new Set(words(step.title).filter((w) => want.has(w))).size
    if (score > bestScore) [best, bestScore] = [step, score]
  }
  return best
}

/** Every question with something to show: its own answer, else the matching notes; the rest are left out. */
export function answeredQuestions(lesson: Lesson | undefined, part: LessonStep | undefined): LessonQuestion[] {
  return (lesson?.questions || []).flatMap((q) => (q.options || q.answer ? [q] : part ? [{ ...q, answer: part.html }] : []))
}
