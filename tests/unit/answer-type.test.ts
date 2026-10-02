import { describe, expect, it } from 'vitest'
import { answerFormat, filterByAnswerPref, matchesAnswerPref } from '@/lib/answer-type'

const both = { choices: true, typed: true }
const onlyMc = { choices: true, typed: false }
const onlyTyped = { choices: false, typed: true }

describe('Opgavetype filter', () => {
  it('"Kun multiple choice" keeps only exercises with options', () => {
    expect(matchesAnswerPref(both, 'mc')).toBe(true)
    expect(matchesAnswerPref(onlyMc, 'mc')).toBe(true)
    expect(matchesAnswerPref(onlyTyped, 'mc')).toBe(false)
  })
  it('"Kun skriv selv" keeps only exercises you can write an answer to', () => {
    expect(matchesAnswerPref(both, 'skriv')).toBe(true)
    expect(matchesAnswerPref(onlyMc, 'skriv')).toBe(false)
    expect(matchesAnswerPref(onlyTyped, 'skriv')).toBe(true)
  })
  it('"Blandet" keeps everything and reports what was hidden', () => {
    const items = [both, onlyMc, onlyTyped]
    expect(filterByAnswerPref(items, (x) => x, 'blandet')).toEqual({ shown: items, hidden: 0 })
    expect(filterByAnswerPref(items, (x) => x, 'mc')).toEqual({ shown: [both, onlyMc], hidden: 1 })
    expect(filterByAnswerPref(items, (x) => x, 'skriv')).toEqual({ shown: [both, onlyTyped], hidden: 1 })
  })
})

describe('answer format', () => {
  it('follows the preference when both are possible', () => {
    expect(answerFormat(both, 'mc', 'x')).toBe('mc')
    expect(answerFormat(both, 'skriv', 'x')).toBe('typed')
  })
  it('falls back to what the exercise supports', () => {
    expect(answerFormat(onlyTyped, 'mc', 'x')).toBe('typed')
    expect(answerFormat(onlyMc, 'skriv', 'x')).toBe('mc')
  })
  it('"Blandet" mixes both, stably per exercise', () => {
    const keys = Array.from({ length: 40 }, (_, i) => `gen:q-sharpe:${i}:2`)
    const formats = keys.map((k) => answerFormat(both, 'blandet', k))
    expect(formats).toContain('mc')
    expect(formats).toContain('typed')
    expect(keys.map((k) => answerFormat(both, 'blandet', k))).toEqual(formats)
  })
})
