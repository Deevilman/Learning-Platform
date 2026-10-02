// Untyped λ-calculus: parser, printer and normal-order β-reduction with
// capture-avoiding substitution. Used by the β-reducer widget and generator.

export type Term = { t: 'var'; n: string } | { t: 'abs'; p: string; b: Term } | { t: 'app'; f: Term; a: Term }

export const V = (n: string): Term => ({ t: 'var', n })
export const L = (p: string, b: Term): Term => ({ t: 'abs', p, b })
export const A = (f: Term, a: Term): Term => ({ t: 'app', f, a })

/** Church numeral n = λf.λx.f (f … (f x)). */
export function church(n: number): Term {
  let body: Term = V('x')
  for (let i = 0; i < n; i++) body = A(V('f'), body)
  return L('f', L('x', body))
}

export const MACROS: Record<string, string> = {
  I: 'λx.x',
  K: 'λx y.x',
  S: 'λx y z.x z (y z)',
  TRUE: 'λt f.t',
  FALSE: 'λt f.f',
  AND: 'λp q.p q p',
  OR: 'λp q.p p q',
  NOT: 'λp.p (λt f.f) (λt f.t)',
  SUCC: 'λn f x.f (n f x)',
  PLUS: 'λm n f x.m f (n f x)',
  MULT: 'λm n f.m (n f)',
  POW: 'λb e.e b',
  PAIR: 'λa b s.s a b',
  FST: 'λp.p (λa b.a)',
  SND: 'λp.p (λa b.b)',
  OMEGA: '(λx.x x) (λx.x x)',
}

export class ParseError extends Error {}

export function parse(src: string, macros: Record<string, string> = MACROS): Term {
  const toks = src.replace(/\\/g, 'λ').match(/λ|\.|\(|\)|[A-Za-z_][A-Za-z0-9_']*|\d+|\S/g) || []
  let i = 0
  const peek = () => toks[i]
  const eat = (s?: string) => {
    const t = toks[i++]
    if (s && t !== s) throw new ParseError(`Forventede "${s}", fandt "${t ?? 'slut'}"`)
    return t
  }
  function term(): Term {
    if (peek() === 'λ') {
      eat('λ')
      const ps: string[] = []
      while (peek() && peek() !== '.') {
        const p = eat()
        if (!/^[a-z_][A-Za-z0-9_']*$/.test(p)) throw new ParseError(`Ugyldig parameter "${p}"`)
        ps.push(p)
      }
      eat('.')
      if (!ps.length) throw new ParseError('λ uden parameter')
      const body = term()
      return ps.reduceRight((b, p) => L(p, b), body)
    }
    let t = atom()
    while (peek() && peek() !== ')') {
      if (peek() === 'λ') return A(t, term())
      t = A(t, atom())
    }
    return t
  }
  function atom(): Term {
    const tk = eat()
    if (tk === undefined) throw new ParseError('Udtrykket slutter for tidligt')
    if (tk === '(') {
      const t = term()
      eat(')')
      return t
    }
    if (/^\d+$/.test(tk)) return church(Number(tk))
    if (/^[A-Z]/.test(tk)) {
      if (!(tk in macros)) throw new ParseError(`Ukendt makro "${tk}"`)
      return parse(macros[tk], macros)
    }
    if (/^[a-z_]/.test(tk)) return V(tk)
    throw new ParseError(`Uventet "${tk}"`)
  }
  const t = term()
  if (i < toks.length) throw new ParseError(`Uventet "${toks[i]}"`)
  return t
}

export function show(t: Term): string {
  switch (t.t) {
    case 'var':
      return t.n
    case 'abs': {
      const ps = [t.p]
      let b = t.b
      while (b.t === 'abs') {
        ps.push(b.p)
        b = b.b
      }
      return `λ${ps.join(' ')}.${show(b)}`
    }
    case 'app': {
      const f = t.f.t === 'abs' ? `(${show(t.f)})` : show(t.f)
      const a = t.a.t === 'var' ? show(t.a) : `(${show(t.a)})`
      return `${f} ${a}`
    }
  }
}

function free(t: Term, acc = new Set<string>()): Set<string> {
  if (t.t === 'var') acc.add(t.n)
  else if (t.t === 'app') {
    free(t.f, acc)
    free(t.a, acc)
  } else {
    const inner = free(t.b)
    inner.delete(t.p)
    inner.forEach((x) => acc.add(x))
  }
  return acc
}

function fresh(base: string, avoid: Set<string>) {
  let n = base.replace(/'+$/, '')
  while (avoid.has(n)) n += "'"
  return n
}

/** t[x := s], capture-avoiding. */
export function subst(t: Term, x: string, s: Term): Term {
  if (t.t === 'var') return t.n === x ? s : t
  if (t.t === 'app') return A(subst(t.f, x, s), subst(t.a, x, s))
  if (t.p === x) return t
  const fs = free(s)
  if (fs.has(t.p) && free(t.b).has(x)) {
    const p2 = fresh(t.p, new Set([...fs, ...free(t.b), x]))
    return L(p2, subst(subst(t.b, t.p, V(p2)), x, s))
  }
  return L(t.p, subst(t.b, x, s))
}

/** One normal-order (leftmost-outermost) β-step, or null if in normal form. */
export function step(t: Term): Term | null {
  if (t.t === 'app') {
    if (t.f.t === 'abs') return subst(t.f.b, t.f.p, t.a)
    const f = step(t.f)
    if (f) return A(f, t.a)
    const a = step(t.a)
    return a ? A(t.f, a) : null
  }
  if (t.t === 'abs') {
    const b = step(t.b)
    return b ? L(t.p, b) : null
  }
  return null
}

export function normalize(t: Term, maxSteps = 500): { steps: Term[]; normal: boolean } {
  const steps = [t]
  let cur = t
  for (let i = 0; i < maxSteps; i++) {
    const n = step(cur)
    if (!n) return { steps, normal: true }
    cur = n
    steps.push(cur)
    if (show(cur).length > 5000) return { steps, normal: false }
  }
  return { steps, normal: false }
}

/** Recognise a Church numeral λf.λx.f (… (f x)). */
export function churchValue(t: Term): number | null {
  if (t.t !== 'abs' || t.b.t !== 'abs') return null
  const f = t.p
  const x = t.b.p
  if (f === x) return null
  let b = t.b.b
  let n = 0
  while (b.t === 'app' && b.f.t === 'var' && b.f.n === f) {
    n++
    b = b.a
  }
  return b.t === 'var' && b.n === x ? n : null
}

export function alphaEq(a: Term, b: Term, env: [string, string][] = []): boolean {
  if (a.t === 'var' && b.t === 'var') {
    for (let i = env.length - 1; i >= 0; i--) {
      const [x, y] = env[i]
      if (x === a.n || y === b.n) return x === a.n && y === b.n
    }
    return a.n === b.n
  }
  if (a.t === 'abs' && b.t === 'abs') return alphaEq(a.b, b.b, [...env, [a.p, b.p]])
  if (a.t === 'app' && b.t === 'app') return alphaEq(a.f, b.f, env) && alphaEq(a.a, b.a, env)
  return false
}
