// A small, sandboxed expression language for exercise templates. Parsed into
// a tree and evaluated by hand — never eval/Function — so a course file can't
// run code. Supports: numbers, variables, + - * / ^ (right-assoc), unary ±,
// parentheses, comparisons (< <= > >= == !=), and/or/not, the constants pi
// and e, and the functions below.

export type Expr =
  | { t: 'num'; v: number }
  | { t: 'var'; name: string }
  | { t: 'un'; op: '-' | '+' | 'not'; a: Expr }
  | { t: 'bin'; op: string; a: Expr; b: Expr }
  | { t: 'call'; fn: string; args: Expr[] }

export class ExprError extends Error {}

const FUNCS: Record<string, { min: number; max: number; f: (...a: number[]) => number }> = {
  sqrt: { min: 1, max: 1, f: Math.sqrt },
  ln: { min: 1, max: 1, f: Math.log },
  log10: { min: 1, max: 1, f: Math.log10 },
  log: { min: 1, max: 2, f: (x, b) => (b === undefined ? Math.log10(x) : Math.log(x) / Math.log(b)) },
  exp: { min: 1, max: 1, f: Math.exp },
  sin: { min: 1, max: 1, f: Math.sin },
  cos: { min: 1, max: 1, f: Math.cos },
  tan: { min: 1, max: 1, f: Math.tan },
  asin: { min: 1, max: 1, f: Math.asin },
  acos: { min: 1, max: 1, f: Math.acos },
  atan: { min: 1, max: 1, f: Math.atan },
  abs: { min: 1, max: 1, f: Math.abs },
  floor: { min: 1, max: 1, f: Math.floor },
  ceil: { min: 1, max: 1, f: Math.ceil },
  round: { min: 1, max: 2, f: (x, d = 0) => { const k = 10 ** d; return Math.round((x + Number.EPSILON * Math.sign(x)) * k) / k } },
  min: { min: 1, max: 99, f: Math.min },
  max: { min: 1, max: 99, f: Math.max },
  gcd: { min: 2, max: 2, f: gcd },
  binom: { min: 2, max: 2, f: binom },
  fact: { min: 1, max: 1, f: fact },
}
export const FUNCTION_NAMES = Object.keys(FUNCS)
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E }

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b) [a, b] = [b, a % b]
  return a
}
function fact(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}
function binom(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n) return 0
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return Math.round(r)
}

// ---------- tokenizer
type Tok = { k: 'num'; v: number } | { k: 'id'; v: string } | { k: 'op'; v: string } | { k: 'end' }
function tokenize(src: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    const num = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i))
    if (num) {
      out.push({ k: 'num', v: Number(num[0]) })
      i += num[0].length
      continue
    }
    const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))
    if (id) {
      const w = id[0]
      out.push(w === 'and' || w === 'or' || w === 'not' ? { k: 'op', v: w } : { k: 'id', v: w })
      i += w.length
      continue
    }
    const op = /^(<=|>=|==|!=|&&|\|\||\*\*|[-+*/^(),<>!%])/.exec(src.slice(i))
    if (op) {
      const map: Record<string, string> = { '&&': 'and', '||': 'or', '!': 'not', '**': '^' }
      out.push({ k: 'op', v: map[op[0]] || op[0] })
      i += op[0].length
      continue
    }
    throw new ExprError(`Ukendt tegn "${c}" i udtrykket`)
  }
  out.push({ k: 'end' })
  return out
}

// ---------- Pratt parser
const BIN: Record<string, [number, 'L' | 'R']> = {
  or: [1, 'L'],
  and: [2, 'L'],
  '==': [3, 'L'],
  '!=': [3, 'L'],
  '<': [4, 'L'],
  '<=': [4, 'L'],
  '>': [4, 'L'],
  '>=': [4, 'L'],
  '+': [5, 'L'],
  '-': [5, 'L'],
  '*': [6, 'L'],
  '/': [6, 'L'],
  '%': [6, 'L'],
  '^': [8, 'R'],
}

export function parseExpr(src: string): Expr {
  if (typeof src === 'number') return { t: 'num', v: src }
  const toks = tokenize(String(src))
  let p = 0
  const peek = () => toks[p]
  const next = () => toks[p++]
  const expectOp = (v: string) => {
    const t = next()
    if (t.k !== 'op' || t.v !== v) throw new ExprError(`Forventede "${v}" i udtrykket "${src}"`)
  }
  function prefix(): Expr {
    const t = next()
    if (t.k === 'num') return { t: 'num', v: t.v }
    if (t.k === 'id') {
      if (peek().k === 'op' && (peek() as { v: string }).v === '(') {
        next()
        const args: Expr[] = []
        if (!(peek().k === 'op' && (peek() as { v: string }).v === ')')) {
          args.push(expr(0))
          while (peek().k === 'op' && (peek() as { v: string }).v === ',') (next(), args.push(expr(0)))
        }
        expectOp(')')
        const f = Object.prototype.hasOwnProperty.call(FUNCS, t.v) ? FUNCS[t.v] : undefined
        if (!f) throw new ExprError(`Ukendt funktion "${t.v}" (kendte: ${FUNCTION_NAMES.join(', ')})`)
        if (args.length < f.min || args.length > f.max) throw new ExprError(`${t.v}() skal have ${f.min === f.max ? f.min : `${f.min}–${f.max}`} argument(er)`)
        return { t: 'call', fn: t.v, args }
      }
      return { t: 'var', name: t.v }
    }
    if (t.k === 'op' && (t.v === '-' || t.v === '+')) return { t: 'un', op: t.v, a: expr(7) }
    if (t.k === 'op' && t.v === 'not') return { t: 'un', op: 'not', a: expr(2.5) }
    if (t.k === 'op' && t.v === '(') {
      const e = expr(0)
      expectOp(')')
      return e
    }
    throw new ExprError(`Udtrykket "${src}" er ufuldstændigt`)
  }
  function expr(minBp: number): Expr {
    let left = prefix()
    for (;;) {
      const t = peek()
      if (t.k !== 'op' || !BIN[t.v]) break
      const [bp, assoc] = BIN[t.v]
      if (bp < minBp || (bp === minBp && assoc === 'L')) break
      next()
      left = { t: 'bin', op: t.v, a: left, b: expr(assoc === 'L' ? bp + 0.5 : bp) }
    }
    return left
  }
  const e = expr(0)
  if (peek().k !== 'end') throw new ExprError(`Uventet "${(peek() as { v: unknown }).v}" i udtrykket "${src}"`)
  return e
}

export function evalExpr(e: Expr, vars: Record<string, number>): number {
  switch (e.t) {
    case 'num':
      return e.v
    case 'var': {
      // own properties only: names like "constructor" must not reach the prototype
      if (Object.prototype.hasOwnProperty.call(vars, e.name) && typeof vars[e.name] === 'number') return vars[e.name]
      if (Object.prototype.hasOwnProperty.call(CONSTS, e.name)) return CONSTS[e.name]
      throw new ExprError(`Ukendt variabel "${e.name}"`)
    }
    case 'un': {
      const a = evalExpr(e.a, vars)
      return e.op === '-' ? -a : e.op === 'not' ? Number(!a) : a
    }
    case 'call':
      return FUNCS[e.fn].f(...e.args.map((x) => evalExpr(x, vars)))
    case 'bin': {
      if (e.op === 'and') return Number(!!evalExpr(e.a, vars) && !!evalExpr(e.b, vars))
      if (e.op === 'or') return Number(!!evalExpr(e.a, vars) || !!evalExpr(e.b, vars))
      const a = evalExpr(e.a, vars)
      const b = evalExpr(e.b, vars)
      switch (e.op) {
        case '+': return a + b
        case '-': return a - b
        case '*': return a * b
        case '/': return a / b
        case '%': return a % b
        case '^': return a ** b
        case '<': return Number(a < b)
        case '<=': return Number(a <= b)
        case '>': return Number(a > b)
        case '>=': return Number(a >= b)
        case '==': return Number(Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b)))
        case '!=': return Number(Math.abs(a - b) > 1e-12 * Math.max(1, Math.abs(a), Math.abs(b)))
      }
    }
  }
  throw new ExprError('Ukendt udtryk')
}

/** Variable names an expression uses (constants and functions excluded). */
export function exprVars(e: Expr, out = new Set<string>()): Set<string> {
  if (e.t === 'var' && !Object.prototype.hasOwnProperty.call(CONSTS, e.name)) out.add(e.name)
  if (e.t === 'un') exprVars(e.a, out)
  if (e.t === 'bin') (exprVars(e.a, out), exprVars(e.b, out))
  if (e.t === 'call') e.args.forEach((x) => exprVars(x, out))
  return out
}

/** Parse and evaluate in one go. */
export const evaluateExpr = (src: string, vars: Record<string, number>) => evalExpr(parseExpr(src), vars)
