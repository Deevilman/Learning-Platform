import { describe, it, expect } from 'vitest'
import { parseNumber, readAnswerNumber, evaluate } from '@/lib/check'
import { formatNumber } from '@/lib/format'

describe('answer checking', () => {
  it('reads US number format and asks about a decimal comma', () => {
    expect(parseNumber('0.25')).toBe(0.25)
    expect(parseNumber('1,234.5')).toBe(1234.5)
    expect(parseNumber('1,234,567')).toBe(1234567)
    expect(parseNumber('0,25')).toBeNull()
    expect(readAnswerNumber('1,5')).toEqual({ ask: '1.5' })
    expect(readAnswerNumber('1.234,5')).toEqual({ ask: '1234.5' })
    expect(readAnswerNumber('12,5 %')).toEqual({ ask: '12.5%' })
    const r = evaluate({ type: 'numeric', answer: 1.5 }, '1,5')
    expect(r).toMatchObject({ correct: false, ask: true, message: 'Mente du 1.5? Brug punktum som decimaltegn.' })
    expect(parseNumber('−3')).toBe(-3)
    expect(parseNumber('1/4')).toBe(0.25)
    expect(parseNumber('25 %')).toBe(0.25)
    expect(parseNumber('2e-3')).toBe(0.002)
    expect(parseNumber('12 kr')).toBe(12)
    expect(parseNumber('abc')).toBeNull()
  })
  it('compares numbers with tolerance and percent units', () => {
    expect(evaluate({ type: 'numeric', answer: 12.5, tolerance: 0.01, unit: '%' }, '12.5 %').correct).toBe(true)
    expect(evaluate({ type: 'numeric', answer: 0.125, tolerance: 0.001 }, '12.5%').correct).toBe(true)
    expect(evaluate({ type: 'numeric', answer: 3, tolerance: 0 }, '3.1').correct).toBe(false)
    expect(evaluate({ type: 'numeric', answer: 1234.5, tolerance: 0.01 }, '1,234.5').correct).toBe(true)
  })
  it('checks lists, choices and text', () => {
    expect(evaluate({ type: 'numeric-list', answers: [1, -2], tolerance: 0 }, '1; -2').correct).toBe(true)
    expect(evaluate({ type: 'numeric-list', answers: [1, 2], ordered: false }, '2; 1').correct).toBe(true)
    expect(evaluate({ type: 'choice', options: ['a', 'b'], correct: 1 }, '1').correct).toBe(true)
    expect(evaluate({ type: 'text', answers: ['1000'] }, ' 1000 ').correct).toBe(true)
  })
  it('formats numbers the US way, without separators inside math', () => {
    expect(formatNumber(1234.5)).toBe('1,234.5')
    expect(formatNumber(1234.5, { math: true })).toBe('1234.5')
    expect(formatNumber(0.1 + 0.2)).toBe('0.3')
    expect(formatNumber(2, { decimals: 2, fixed: true })).toBe('2.00')
    expect(formatNumber(-0.001)).toBe('0')
  })
})
