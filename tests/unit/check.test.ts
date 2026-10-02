import { describe, it, expect } from 'vitest'
import { parseNumber, evaluate } from '@/lib/check'

describe('answer checking', () => {
  it('parses Danish and English number formats', () => {
    expect(parseNumber('0,25')).toBe(0.25)
    expect(parseNumber('1.234,5')).toBe(1234.5)
    expect(parseNumber('1,234.5')).toBe(1234.5)
    expect(parseNumber('−3')).toBe(-3)
    expect(parseNumber('1/4')).toBe(0.25)
    expect(parseNumber('25 %')).toBe(0.25)
    expect(parseNumber('2e-3')).toBe(0.002)
    expect(parseNumber('12 kr')).toBe(12)
    expect(parseNumber('abc')).toBeNull()
  })
  it('compares numbers with tolerance and percent units', () => {
    expect(evaluate({ type: 'numeric', answer: 12.5, tolerance: 0.01, unit: '%' }, '12,5 %').correct).toBe(true)
    expect(evaluate({ type: 'numeric', answer: 0.125, tolerance: 0.001 }, '12,5 %').correct).toBe(true)
    expect(evaluate({ type: 'numeric', answer: 3, tolerance: 0 }, '3,1').correct).toBe(false)
  })
  it('checks lists, choices and text', () => {
    expect(evaluate({ type: 'numeric-list', answers: [1, -2], tolerance: 0 }, '1; -2').correct).toBe(true)
    expect(evaluate({ type: 'numeric-list', answers: [1, 2], ordered: false }, '2; 1').correct).toBe(true)
    expect(evaluate({ type: 'choice', options: ['a', 'b'], correct: 1 }, '1').correct).toBe(true)
    expect(evaluate({ type: 'text', answers: ['1000'] }, ' 1000 ').correct).toBe(true)
  })
})
