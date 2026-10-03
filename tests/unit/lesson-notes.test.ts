// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { answeredQuestions, notesForVideo, videoUnavailable } from '@/lib/lesson-notes'
import type { VideoItem, Week } from '@/types/content'

const long = 'Lang forklaring. '.repeat(20)
const notes = [`<p><strong>1. Sandsynlighedsrum.</strong> ${long}</p>`, `<p><strong>2. Betinget sandsynlighed og Bayes.</strong> ${long}</p>`, `<p><strong>3. Uafhængighed.</strong> ${long}</p>`].join('\n')
const video = (over: Partial<VideoItem>): VideoItem => ({ id: 'v', key: 'P1', title: 'Video', optional: false, added: false, sources: [{ title: 'x', youtube: 'abc' }], links: [], ...over })

describe('notes for a lesson', () => {
  it('picks the notes part whose heading matches the Fokus text', () => {
    expect(notesForVideo(notes, video({ focus: 'Hvad betyder <em>uafhængige</em> hændelser?' }))?.title).toBe('Uafhængighed')
    expect(notesForVideo(notes, video({ title: 'Bayes’ sætning' }))?.title).toBe('Betinget sandsynlighed og Bayes')
    expect(notesForVideo(notes, video({ focus: 'Matricer og vektorer' }))).toBeUndefined()
  })

  it('treats Steady and missing videos as unavailable', () => {
    expect(videoUnavailable(video({}))).toBe(false)
    expect(videoUnavailable(video({ sources: [{ title: 'x', access: 'steady' }] }))).toBe(true)
    expect(videoUnavailable(video({ sources: [{ title: 'x', search: 'x' }] }))).toBe(true)
    expect(videoUnavailable(video({ sources: [] }))).toBe(true)
  })

  it('gives every question an answer or leaves it out', () => {
    const part = { title: 'Bayes', html: '<p>Svar</p>' }
    const lesson = { goals: [], questions: [{ prompt: 'a', answer: '<p>egen</p>' }, { prompt: 'b', options: ['x', 'y'], correct: 0 }, { prompt: 'c' }] }
    expect(answeredQuestions(lesson, part).map((q) => q.answer ?? 'mc')).toEqual(['<p>egen</p>', 'mc', '<p>Svar</p>'])
    expect(answeredQuestions(lesson, undefined).map((q) => q.prompt)).toEqual(['a', 'b'])
  })
})

describe('lesson pages in the built courses', () => {
  const dir = 'public/data/courses'
  const weeks: Week[] = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .flatMap((d) => readdirSync(join(dir, d.name)).filter((f) => /^week-\d+\.json$/.test(f)).map((f) => JSON.parse(readFileSync(join(dir, d.name, f), 'utf8'))))
    : []

  it.skipIf(!weeks.length)('Steady and missing videos always have notes to show', () => {
    for (const w of weeks) for (const v of w.videos) if (videoUnavailable(v)) expect(notesForVideo(w.notes, v) || w.notes.trim(), `${w.title}: ${v.key}`).toBeTruthy()
    expect(weeks.some((w) => w.videos.some((v) => v.sources.some((s) => s.access === 'steady') && notesForVideo(w.notes, v)))).toBe(true)
  })

  it.skipIf(!weeks.length)('every visible check question has an answer', () => {
    for (const w of weeks)
      for (const v of w.videos) for (const q of answeredQuestions(v.lesson, notesForVideo(w.notes, v))) expect(q.options?.length || q.answer, `${w.title}: ${v.key}`).toBeTruthy()
  })

  it('no lesson page shows the draft banner', () => {
    for (const lang of ['da', 'en']) expect(readFileSync(`src/i18n/${lang}.json`, 'utf8')).not.toMatch(/lesson\.draft|Udkast: denne side|Svaret kommer i videoen/)
    expect(readFileSync('src/pages/WeekPage.tsx', 'utf8')).not.toMatch(/\.draft\b/)
  })
})
