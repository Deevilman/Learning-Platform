import { defineGenerator } from '@/lib/generators'

// Negating nested quantifiers: push ¬ inwards, flipping ∀/∃ and negating the matrix.
const PREDS = [
  { s: 'x + y = 0', n: 'x + y \\neq 0' },
  { s: 'x < y', n: 'x \\geq y' },
  { s: 'x \\mid y', n: 'x \\nmid y' },
  { s: 'x^2 \\leq y', n: 'x^2 > y' },
  { s: 'P(x, y)', n: '\\neg P(x, y)' },
  { s: 'x \\cdot y = 1', n: 'x \\cdot y \\neq 1' },
]
const DOMS = ['\\mathbb{N}', '\\mathbb{Z}', '\\mathbb{R}']
const flip = (q: string) => (q === '\\forall' ? '\\exists' : '\\forall')

export default defineGenerator({
  id: 'f-quantifier-negation',
  title: 'Negation af kvantorer',
  course: 'foundations',
  topics: ['proofs-quantifiers'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const p = rng.pick(PREDS)
    // Divisibility only makes sense for integers.
    const dom = p.s.includes('mid') ? rng.pick(DOMS.slice(0, 2)) : rng.pick(DOMS)
    const vars = d === 1 ? ['x'] : d === 2 ? ['x', 'y'] : ['x', 'y', 'z']
    const qs = vars.map(() => rng.pick(['\\forall', '\\exists']))
    const prefix = (qq: string[]) => qq.map((q, i) => `${q} ${vars[i]} \\in ${dom}\\;`).join(' ')
    // Matrix and its negation (d = 1 fixes y = 1; d = 3 adds a conjunct, negated with De Morgan).
    const sub = (s: string) => (d === 1 ? s.replace(/y/g, '1') : s)
    const mat = sub(p.s) + (d === 3 ? ' \\land z > x' : '')
    const neg = sub(p.n) + (d === 3 ? ' \\lor z \\leq x' : '')
    const right = `${prefix(qs.map(flip))} (${neg})`
    const candidates = [
      right,
      `${prefix(qs)} (${neg})`, // forgot to flip the quantifiers
      `${prefix(qs.map(flip))} (${mat})`, // forgot to negate the matrix
      d === 3 ? `${prefix(qs.map(flip))} (${sub(p.n)} \\land z \\leq x)` : `\\neg ${prefix(qs)} (${neg})`, // wrong De Morgan / double negation
    ]
    const opts = rng.shuffle(candidates.filter((x, i, a) => a.indexOf(x) === i))
    return {
      prompt: `Hvilken formel er ækvivalent med negationen af\n\n$$${prefix(qs)} (${mat})\\,?$$`,
      hint: '$\\neg\\forall x\\,\\varphi \\equiv \\exists x\\,\\neg\\varphi$ og $\\neg\\exists x\\,\\varphi \\equiv \\forall x\\,\\neg\\varphi$. Skub negationen ind én kvantor ad gangen, og negér til sidst kernen.',
      solution: `Skub $\\neg$ indad: hver $\\forall$ bliver til $\\exists$ og omvendt, og til sidst negeres kernen${d === 3 ? ' (med De Morgan: $\\neg(A \\land B) \\equiv \\neg A \\lor \\neg B$)' : ''}:\n\n$$${right}$$`,
      check: { type: 'choice', options: opts.map((o) => `$${o}$`), correct: opts.indexOf(right) },
    }
  },
})
