import { describe, expect, it } from 'vitest'
import { channelOk, titleScore } from '../../scripts/verify-videos'

describe('video verification', () => {
  it('matches titles that differ only in numbering and notes', () => {
    expect(titleScore('L9: Reducibility', '9. Reducibility')).toBe(1)
    expect(titleScore('(tilføjet) Computerphile – "Lambda Calculus" (Graham Hutton, 13 min) — spring over, hvis du så den i uge 10.', 'Lambda Calculus - Computerphile')).toBe(1)
    expect(titleScore('Start Learning Logic | Part 1', 'Start Learning Logic 1 | Logical Statements, Negations and Conjunction [dark version]')).toBe(1)
  })
  it('rejects a different video', () => {
    expect(titleScore('Start Learning Sets | Part 2 (Predicates, Equality and Subsets)', 'Never Gonna Give You Up')).toBeLessThan(0.6)
  })
  it('checks the channel', () => {
    expect(channelOk('MIT OpenCourseWare', 'MIT OpenCourseWare')).toBe(true)
    expect(channelOk('Man AHL', 'Man Group')).toBe(true)
    expect(channelOk('MIT OpenCourseWare', 'Random Reuploads')).toBe(false)
    expect(channelOk(undefined, 'Numberphile')).toBe(true)
    expect(channelOk(undefined, 'Random Reuploads')).toBe(false)
  })
})

describe('video numbering', () => {
  it('requires part numbers to match', () => {
    expect(titleScore('Start Learning Logic | Part 3', 'Start Learning Logic 1 | Logical Statements, Negations and Conjunction')).toBeLessThan(0.6)
    expect(titleScore('1.4.4 Truth Tables', '1.4.4 Truth Tables: Video')).toBe(1)
  })
})
