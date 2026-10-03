// Evaluates answers against an AutoCheck. Accepts Danish number formats
// ("0,25", "1.234,5", "12 %"), fractions ("1/3") and simple constants.

import type { AutoCheck } from '@/types/content'
import { evalExpr, exprVars, parseExpr, ExprError } from './expr'
import { formatNumber, readNumber } from './format'
import { tr } from '../i18n/translate'

/** Compare two expressions numerically at fixed pseudo-random points. */
function checkExpression(check: Extract<AutoCheck, { type: 'expression' }>, answer: string) {
  let got
  try {
    got = parseExpr(answer.replace(/·|×/g, '*').replace(/−/g, '-'))
  } catch (e) {
    return { correct: false, message: e instanceof ExprError ? `${e.message}.` : tr('check.exprUnreadable') }
  }
  const unknown = [...exprVars(got)].filter((v) => !check.variables.includes(v))
  if (unknown.length) return { correct: false, message: tr('check.onlyVars', { vars: check.variables.join(', '), bad: unknown.join(', ') }) }
  const want = parseExpr(check.expected)
  const tol = check.tolerance ?? 1e-6
  let compared = 0
  for (let i = 0; i < 12 && compared < 6; i++) {
    const vars = Object.fromEntries(check.variables.map((v, j) => [v, 0.37 + ((i * 7 + j * 3) % 11) * 0.29]))
    const a = evalExpr(want, vars)
    const b = evalExpr(got, vars)
    if (!isFinite(a)) continue // a point where the expression isn't defined
    compared++
    if (!isFinite(b) || Math.abs(a - b) > tol * Math.max(1, Math.abs(a))) return { correct: false, message: tr('check.notQuiteA', { answer: check.expected }) }
  }
  return compared ? { correct: true, message: tr('answer.right') } : { correct: false, message: tr('check.exprUncheckable') }
}

/** A typed number, fraction (1/4), percent (25 %) or scientific (1e-3); US format. Null if unreadable or ambiguous. */
export function parseNumber(input: string): number | null {
  const r = readAnswerNumber(input)
  return r && 'value' in r ? r.value : null
}

/** Like parseNumber, but says what the learner probably meant when a decimal comma was used. */
export function readAnswerNumber(input: string): { value: number } | { ask: string } | null {
  let s = input.trim().toLowerCase().replace(/−/g, '-').replace(/\s+/g, '')
  if (!s) return null
  let scale = 1
  let suffix = ''
  if (s.endsWith('%')) {
    s = s.slice(0, -1)
    scale = 0.01
    suffix = '%'
  } else if (s.endsWith('‰')) {
    s = s.slice(0, -1)
    scale = 0.001
    suffix = '‰'
  }
  s = s.replace(/(kr\.?|dkk|usd|eur|\$|€)$/, '').replace(/^(kr\.?|\$|€)/, '')
  const frac = /^(-?[\d.,]+)\/(-?[\d.,]+)$/.exec(s)
  if (frac) {
    const a = readNumber(frac[1])
    const b = readNumber(frac[2])
    if (!a || !b) return null
    if ('ask' in a || 'ask' in b) return { ask: `${'ask' in a ? a.ask : frac[1]}/${'ask' in b ? b.ask : frac[2]}${suffix}` }
    return b.value !== 0 ? { value: (a.value / b.value) * scale } : null
  }
  if (/^-?\d+(?:\.\d+)?e-?\d+$/.test(s)) return { value: Number(s) * scale }
  const r = readNumber(s)
  if (!r) return null
  if ('ask' in r) return { ask: r.ask + suffix }
  return isFinite(r.value) ? { value: r.value * scale } : null
}

export interface CheckResult {
  correct: boolean
  message: string
  /** Not graded: the answer was ambiguous (e.g. a decimal comma); ask the learner instead. */
  ask?: boolean
}

const askComma = (meant: string) => ({ correct: false, ask: true, message: tr('check.meant', { n: meant }) })

const fmt = (x: number) => (Math.abs(x) >= 1e6 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(4) : formatNumber(+x.toPrecision(8), { decimals: 8 }))

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
      const read = readAnswerNumber(pctUnit ? answer.replace(/%/g, '') : answer)
      if (read && 'ask' in read) return askComma(read.ask)
      const v = read ? read.value : null
      if (v === null) return { correct: false, message: tr('check.writeNumber') }
      const ok = numericClose(v, check.answer, check.tolerance, check.relative)
      return ok ? { correct: true, message: tr('answer.right') } : { correct: false, message: tr('check.expected', { answer: `${fmt(check.answer)}${check.unit ? ' ' + check.unit : ''}` }) }
    }
    case 'numeric-list': {
      const parts = answer.split(/[;\n]|,\s+|\s+/).map((p) => p.trim()).filter(Boolean)
      const ambiguous = parts.map(readAnswerNumber).find((r) => r && 'ask' in r) as { ask: string } | undefined
      if (ambiguous) return askComma(ambiguous.ask)
      const vals = parts.map(parseNumber)
      if (vals.some((v) => v === null) || vals.length !== check.answers.length)
        return { correct: false, message: tr('check.writeList', { n: check.answers.length }) }
      const got = vals as number[]
      const want = [...check.answers]
      const a = check.ordered === false ? [...got].sort((x, y) => x - y) : got
      const b = check.ordered === false ? want.sort((x, y) => x - y) : want
      const ok = a.every((v, i) => numericClose(v, b[i], check.tolerance))
      return ok ? { correct: true, message: tr('answer.right') } : { correct: false, message: tr('check.expected', { answer: check.answers.map(fmt).join('; ') }) }
    }
    case 'choice': {
      const idx = Number(answer)
      const ok = idx === check.correct
      const why = check.explanations?.[idx]
      return ok ? { correct: true, message: tr('answer.right') } : { correct: false, message: `${tr('answer.notQuite')}${why ? ` ${why}` : ''} ${tr('answer.rightIs')} ${check.options[check.correct]}` }
    }
    case 'text': {
      const norm = (s: string) => (check.caseSensitive ? s : s.toLowerCase()).replace(/\s+/g, ' ').trim()
      // a set: the same elements in any order ("{1, 2, 3}" = "3,2,1")
      const asSet = (s: string) => [...new Set(norm(s).replace(/^[{[(]|[}\])]$/g, '').split(/\s*[,;]\s*/).filter(Boolean))].sort().join(',')
      const ok = check.answers.some((a) => (check.set ? asSet(a) === asSet(answer) : norm(a) === norm(answer)))
      return ok ? { correct: true, message: tr('answer.right') } : { correct: false, message: tr('check.notQuiteA', { answer: check.answers[0] }) }
    }
    case 'expression':
      return checkExpression(check, answer)
    case 'output': {
      const norm = (s: string) => s.replace(/\r/g, '').replace(/[ \t]+$/gm, '').trim()
      const ok = norm(answer) === norm(check.expected)
      return ok ? { correct: true, message: tr('check.outputOk') } : { correct: false, message: tr('check.outputWrong') }
    }
  }
}
