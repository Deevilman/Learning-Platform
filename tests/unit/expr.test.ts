import { describe, expect, it } from 'vitest'
import { evaluateExpr, ExprError, exprVars, parseExpr } from '@/lib/expr'

const ev = (s: string, v: Record<string, number> = {}) => evaluateExpr(s, v)

describe('expression engine', () => {
  it('does arithmetic with the usual precedence', () => {
    expect(ev('1 + 2 * 3')).toBe(7)
    expect(ev('(1 + 2) * 3')).toBe(9)
    expect(ev('2 ^ 3 ^ 2')).toBe(512) // right-associative
    expect(ev('-2 ^ 2')).toBe(-4)
    expect(ev('10 / 4')).toBe(2.5)
    expect(ev('m / M', { m: 18.02, M: 18.02 })).toBe(1)
    expect(ev('2 ** 10')).toBe(1024)
  })
  it('knows the template functions and constants', () => {
    expect(ev('sqrt(16) + abs(-2)')).toBe(6)
    expect(ev('ln(e)')).toBeCloseTo(1)
    expect(ev('log10(1000)')).toBeCloseTo(3)
    expect(ev('exp(0) + sin(0) + cos(0) + tan(0)')).toBe(2)
    expect(ev('round(3.14159, 2)')).toBe(3.14)
    expect(ev('round(2.5)')).toBe(3)
    expect(ev('gcd(12, 18)')).toBe(6)
    expect(ev('binom(5, 2)')).toBe(10)
    expect(ev('fact(5)')).toBe(120)
    expect(ev('min(3, 1, 2) + max(3, 1, 2)')).toBe(4)
    expect(ev('pi')).toBeCloseTo(Math.PI)
  })
  it('evaluates conditions', () => {
    expect(ev('n > 0.01', { n: 0.5 })).toBe(1)
    expect(ev('a != b and a > 0', { a: 2, b: 3 })).toBe(1)
    expect(ev('not (a == b) or false_', { a: 1, b: 1, false_: 0 })).toBe(0)
    expect(ev('0.1 + 0.2 == 0.3')).toBe(1) // tolerant equality
  })
  it('is sandboxed: no property access, strings or code', () => {
    for (const bad of ['constructor', 'this.x', 'alert(1)', "'x'", 'a; b', 'process.exit()', '[1]', 'x => x', '`x`']) expect(() => ev(bad, { x: 1 }), bad).toThrow(ExprError)
  })
  it('explains mistakes in Danish', () => {
    expect(() => ev('sqrt(1, 2)')).toThrow(/skal have 1 argument/)
    expect(() => ev('foo(1)')).toThrow(/Ukendt funktion "foo"/)
    expect(() => ev('y + 1')).toThrow(/Ukendt variabel "y"/)
    expect(() => ev('(1 + 2')).toThrow(/Forventede "\)"/)
    expect(() => ev('1 +')).toThrow(/ufuldstændigt/)
  })
  it('lists the variables an expression uses', () => {
    expect([...exprVars(parseExpr('m / M * pi + sqrt(x)'))].sort()).toEqual(['M', 'm', 'x'])
  })
})
