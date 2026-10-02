import { defineGenerator } from '@/lib/generators'

const fmt = (s: number[]) => (s.length ? `\\{${[...s].sort((a, b) => a - b).join(', ')}\\}` : '\\emptyset')

export default defineGenerator({
  id: 'f-set-operations',
  title: 'Mængdeoperationer',
  course: 'foundations',
  topics: ['sets-functions'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const U = Array.from({ length: 10 }, (_, i) => i + 1)
    const A = rng.sample(U, rng.int(3, 6))
    const B = rng.sample(U, rng.int(3, 6))
    const C = rng.sample(U, rng.int(3, 6))
    const has = (S: number[]) => (x: number) => S.includes(x)
    const ops = [
      { d: 1, tex: 'A \\cup B', f: (x: number) => has(A)(x) || has(B)(x) },
      { d: 1, tex: 'A \\cap B', f: (x: number) => has(A)(x) && has(B)(x) },
      { d: 1, tex: 'A \\setminus B', f: (x: number) => has(A)(x) && !has(B)(x) },
      { d: 2, tex: '(A \\cup B) \\setminus C', f: (x: number) => (has(A)(x) || has(B)(x)) && !has(C)(x) },
      { d: 2, tex: 'A \\cap (B \\cup C)', f: (x: number) => has(A)(x) && (has(B)(x) || has(C)(x)) },
      { d: 2, tex: 'A \\,\\triangle\\, B', f: (x: number) => has(A)(x) !== has(B)(x) },
      { d: 3, tex: '\\overline{A \\cup B} \\cap C', f: (x: number) => !(has(A)(x) || has(B)(x)) && has(C)(x) },
      { d: 3, tex: '(A \\setminus B) \\cup (C \\setminus A)', f: (x: number) => (has(A)(x) && !has(B)(x)) || (has(C)(x) && !has(A)(x)) },
      { d: 3, tex: '(A \\triangle B) \\triangle C', f: (x: number) => (has(A)(x) !== has(B)(x)) !== has(C)(x) },
    ]
    const op = rng.pick(ops.filter((o) => o.d === d))
    const R = U.filter(op.f)
    return {
      prompt: `Grundmængden er $U = \\{1, \\dots, 10\\}$, og\n\n$$A = ${fmt(A)},\\quad B = ${fmt(B)}${d > 1 ? `,\\quad C = ${fmt(C)}` : ''}.$$\n\nHvor mange elementer har $${op.tex}$?${d === 3 ? ' ($\\overline{X}$ er komplementet i $U$, og $\\triangle$ er symmetrisk differens.)' : d === 2 && op.tex.includes('triangle') ? ' ($\\triangle$ er symmetrisk differens.)' : ''}`,
      hint: 'Gå elementerne $1, \\dots, 10$ igennem ét ad gangen, og afgør for hvert, om det er med.',
      solution: `$${op.tex} = ${fmt(R)}$, som har **${R.length}** elementer.`,
      check: { type: 'numeric', answer: R.length, tolerance: 0 },
    }
  },
})
