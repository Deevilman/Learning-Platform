// Evaluates answers against an AutoCheck. Accepts Danish number formats
// ("0,25", "1.234,5", "12 %"), fractions ("1/3") and simple constants.

import type { AutoCheck } from '@/types/content'
import { evalExpr, exprVars, parseExpr, ExprError } from './expr'

/** Compare two expressions numerically at fixed pseudo-random points. */
function checkExpression(check: Extract<AutoCheck, { type: 'expression' }>, answer: string) {
  let got
  try {
    got = parseExpr(answer.replace(/·|×/g, '*').replace(/−/g, '-').replace(/,/g, '.'))
  } catch (e) {
    return { correct: false, message: e instanceof ExprError ? `${e.message}.` : 'Udtrykket kunne ikke læses.' }
  }
  const unknown = [...exprVars(got)].filter((v) => !check.variables.includes(v))
  if (unknown.length) return { correct: false, message: `Brug kun ${check.variables.join(', ')} — ikke ${unknown.join(', ')}.` }
  const want = parseExpr(check.expected)
  const tol = check.tolerance ?? 1e-6
  let compared = 0
  for (let i = 0; i < 12 && compared < 6; i++) {
    const vars = Object.fromEntries(check.variables.map((v, j) => [v, 0.37 + ((i * 7 + j * 3) % 11) * 0.29]))
    const a = evalExpr(want, vars)
    const b = evalExpr(got, vars)
    if (!isFinite(a)) continue // a point where the expression isn't defined
    compared++
    if (!isFinite(b) || Math.abs(a - b) > tol * Math.max(1, Math.abs(a))) return { correct: false, message: `Ikke helt. Et korrekt svar er ${check.expected}.` }
  }
  return compared ? { correct: true, message: 'Rigtigt!' } : { correct: false, message: 'Udtrykket kunne ikke tjekkes.' }
}

/** Parse a number as a Danish or English learner might type it. */
export function parseNumber(input: string): number | null {
  let s = input.trim().toLowerCase().replace(/−/g, '-').replace(/\s+/g, '')
  if (!s) return null
  let scale = 1
  if (s.endsWith('%')) {
    s = s.slice(0, -1)
    scale = 0.01
  } else if (s.endsWith('‰')) {
    s = s.slice(0, -1)
    scale = 0.001
  }
  s = s.replace(/(kr|dkk|usd|eur|\$|€)$/, '').replace(/^(kr\.?|\$|€)/, '')
  // Fraction a/b
  const frac = /^(-?[\d.,]+)\/(-?[\d.,]+)$/.exec(s)
  if (frac) {
    const a = parseNumber(frac[1])
    const b = parseNumber(frac[2])
    return a !== null && b !== null && b !== 0 ? (a / b) * scale : null
  }
  // Scientific notation
  if (/^-?\d+(?:[.,]\d+)?e-?\d+$/.test(s)) return Number(s.replace(',', '.')) * scale
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    // The last separator is the decimal separator.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (hasComma) {
    s = s.replace(',', '.')
  }
  if (!/^-?\d*\.?\d+$/.test(s) && !/^-?\d+\.?$/.test(s)) return null
  const v = Number(s)
  return isFinite(v) ? v * scale : null
}

export interface CheckResult {
  correct: boolean
  message: string
}

const fmt = (x: number) => (Math.abs(x) >= 1e6 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(4) : String(+x.toPrecision(8))).replace('.', ',')

export function numericClose(got: number, want: number, tolerance?: number, relative?: boolean): boolean {
  const tol = tolerance ?? Math.max(1e-9, Math.abs(want) * 1e-6)
  return relative ? Math.abs(got - want) <= Math.abs(want) * tol + 1e-12 : Math.abs(got - want) <= tol + 1e-12
}

export function evaluate(check: AutoCheck, answer: string): CheckResult {
  switch (check.type) {
    case 'numeric': {
      // When the expected value is itself in percent (unit "%"), "12,5 %" means 12.5;
      // otherwise "25 %" means 0.25.
      const pctUnit = check.unit === '%'
      const v = parseNumber(pctUnit ? answer.replace(/%/g, '') : answer)
      if (v === null) return { correct: false, message: 'Skriv et tal (fx 0,25 eller 1/4).' }
      const ok = numericClose(v, check.answer, check.tolerance, check.relative)
      return ok ? { correct: true, message: 'Rigtigt!' } : { correct: false, message: `Ikke helt. Det forventede svar er ${fmt(check.answer)}${check.unit ? ' ' + check.unit : ''}.` }
    }
    case 'numeric-list': {
      const parts = answer.split(/[;\n]|,\s+|\s+/).map((p) => p.trim()).filter(Boolean)
      const vals = parts.map(parseNumber)
      if (vals.some((v) => v === null) || vals.length !== check.answers.length)
        return { correct: false, message: `Skriv ${check.answers.length} tal adskilt af semikolon.` }
      const got = vals as number[]
      const want = [...check.answers]
      const a = check.ordered === false ? [...got].sort((x, y) => x - y) : got
      const b = check.ordered === false ? want.sort((x, y) => x - y) : want
      const ok = a.every((v, i) => numericClose(v, b[i], check.tolerance))
      return ok ? { correct: true, message: 'Rigtigt!' } : { correct: false, message: `Ikke helt. Forventet: ${check.answers.map(fmt).join('; ')}.` }
    }
    case 'choice': {
      const idx = Number(answer)
      const ok = idx === check.correct
      const why = check.explanations?.[idx]
      return ok ? { correct: true, message: 'Rigtigt!' } : { correct: false, message: `Ikke helt.${why ? ` ${why}` : ''} Det rigtige svar er: ${check.options[check.correct]}` }
    }
    case 'text': {
      const norm = (s: string) => (check.caseSensitive ? s : s.toLowerCase()).replace(/\s+/g, ' ').trim()
      // a set: the same elements in any order ("{1, 2, 3}" = "3,2,1")
      const asSet = (s: string) => [...new Set(norm(s).replace(/^[{[(]|[}\])]$/g, '').split(/\s*[,;]\s*/).filter(Boolean))].sort().join(',')
      const ok = check.answers.some((a) => (check.set ? asSet(a) === asSet(answer) : norm(a) === norm(answer)))
      return ok ? { correct: true, message: 'Rigtigt!' } : { correct: false, message: `Ikke helt. Et korrekt svar er: ${check.answers[0]}` }
    }
    case 'expression':
      return checkExpression(check, answer)
    case 'output': {
      const norm = (s: string) => s.replace(/\r/g, '').replace(/[ \t]+$/gm, '').trim()
      const ok = norm(answer) === norm(check.expected)
      return ok ? { correct: true, message: 'Udskriften passer!' } : { correct: false, message: 'Udskriften passer ikke med det forventede.' }
    }
  }
}
