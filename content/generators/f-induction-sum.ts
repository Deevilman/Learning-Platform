import { defineGenerator, frac } from '@/lib/generators'

// Closed forms that are proved by induction in week 3.
const FORMS = [
  { d: 1, tex: (n: number) => `\\sum_{k=1}^{${n}} k`, val: (n: number) => (n * (n + 1)) / 2, closed: '\\frac{n(n+1)}{2}' },
  { d: 1, tex: (n: number) => `\\sum_{k=1}^{${n}} (2k-1)`, val: (n: number) => n * n, closed: 'n^2' },
  { d: 2, tex: (n: number) => `\\sum_{k=1}^{${n}} k^2`, val: (n: number) => (n * (n + 1) * (2 * n + 1)) / 6, closed: '\\frac{n(n+1)(2n+1)}{6}' },
  { d: 2, tex: (n: number) => `\\sum_{k=0}^{${n}} 2^k`, val: (n: number) => 2 ** (n + 1) - 1, closed: '2^{n+1}-1' },
  { d: 3, tex: (n: number) => `\\sum_{k=1}^{${n}} k^3`, val: (n: number) => ((n * (n + 1)) / 2) ** 2, closed: '\\left(\\frac{n(n+1)}{2}\\right)^2' },
  { d: 3, tex: (n: number) => `\\sum_{k=1}^{${n}} k \\cdot k!`, val: (n: number) => fact(n + 1) - 1, closed: '(n+1)! - 1' },
  { d: 3, tex: (n: number) => `\\sum_{k=0}^{${n}} 3^k`, val: (n: number) => (3 ** (n + 1) - 1) / 2, closed: '\\frac{3^{n+1}-1}{2}' },
]
function fact(n: number): number {
  return n <= 1 ? 1 : n * fact(n - 1)
}

export default defineGenerator({
  id: 'f-induction-sum',
  title: 'Summer med lukket form (induktion)',
  course: 'foundations',
  topics: ['induction'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const f = rng.pick(FORMS.filter((x) => x.d === d))
    const n = f.closed.includes('!') ? rng.int(4, 8) : f.closed.includes('^{n+1}') ? rng.int(5, 12) : rng.int(8, 60)
    const val = f.val(n)
    void frac
    return {
      prompt: `Beregn\n\n$$${f.tex(n)}$$\n\n(Brug gerne den lukkede form, som man beviser ved induktion.)`,
      hint: `Den lukkede form er $${f.closed}$. Indsæt $n = ${n}$.`,
      solution: `Ved induktion efter $n$ gælder $${f.tex(0).replace('{0}', '{n}')} = ${f.closed}$ for alle $n$ (basis: tjek $n = ${f.closed.includes('!') || f.tex(0).includes('k=1') ? 1 : 0}$; skridt: læg det næste led til begge sider og omskriv).\n\nMed $n = ${n}$ fås **${val}**.`,
      check: { type: 'numeric', answer: val, tolerance: 0 },
    }
  },
})
