import { defineGenerator } from '@/lib/generators'
import { bin, not, v, ev, rows, tex, truthTable, SF, type F } from './_logic'

// Pairs (left, right) built from laws and from typical mistakes. Whether a
// pair is equivalent is always decided by computing the truth table.
type Pair = (a: F, b: F, c: F) => [F, F]
const PAIRS: Pair[] = [
  (a, b) => [not(bin('and', a, b)), bin('or', not(a), not(b))], // De Morgan
  (a, b) => [not(bin('and', a, b)), bin('and', not(a), not(b))], // wrong De Morgan
  (a, b) => [not(bin('or', a, b)), bin('and', not(a), not(b))],
  (a, b) => [bin('imp', a, b), bin('or', not(a), b)],
  (a, b) => [bin('imp', a, b), bin('imp', b, a)], // converse
  (a, b) => [bin('imp', a, b), bin('imp', not(b), not(a))], // contraposition
  (a, b) => [bin('imp', a, b), bin('imp', not(a), not(b))], // inverse
  (a, b) => [not(bin('imp', a, b)), bin('and', a, not(b))],
  (a, b) => [not(bin('imp', a, b)), bin('imp', not(a), not(b))],
  (a, b, c) => [bin('and', a, bin('or', b, c)), bin('or', bin('and', a, b), bin('and', a, c))],
  (a, b, c) => [bin('or', a, bin('and', b, c)), bin('and', bin('or', a, b), c)],
  (a, b, c) => [bin('imp', a, bin('imp', b, c)), bin('imp', bin('and', a, b), c)],
  (a, b, c) => [bin('imp', bin('imp', a, b), c), bin('imp', a, bin('imp', b, c))],
  (a, b, c) => [bin('and', bin('imp', a, c), bin('imp', b, c)), bin('imp', bin('or', a, b), c)],
  (a, b, c) => [bin('or', bin('imp', a, c), bin('imp', b, c)), bin('imp', bin('or', a, b), c)],
  (a, b) => [bin('iff', a, b), bin('and', bin('imp', a, b), bin('imp', b, a))],
  (a, b) => [bin('iff', a, b), bin('or', bin('and', a, b), bin('and', not(a), not(b)))],
  (a, b) => [bin('iff', a, b), bin('iff', not(a), not(b))],
  (a, b) => [bin('and', a, bin('or', a, b)), a],
  (a, b) => [bin('or', a, bin('and', a, b)), b],
]

export default defineGenerator({
  id: 'f-equivalence',
  title: 'Logisk ækvivalens',
  course: 'foundations',
  topics: ['propositional-logic'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const atoms = ['p', 'q', 'r']
    const pick = () => (d >= 3 && rng.chance(0.4) ? not(v(rng.pick(atoms))) : v(rng.pick(atoms)))
    const [a, b, c] = rng.shuffle(atoms).map((x) => (d >= 2 && rng.chance(0.3) ? not(v(x)) : v(x)))
    void pick
    const pair = d === 1 ? rng.pick(PAIRS.slice(0, 9)) : rng.pick(PAIRS)
    let [l, r] = pair(a, b, c)
    if (rng.chance(0.5)) [l, r] = [r, l]
    const names = atoms.filter((x) => tex(l).includes(x) || tex(r).includes(x))
    const all = rows(names)
    const counter = all.find((s) => ev(l, s) !== ev(r, s))
    const eq = !counter
    return {
      prompt: `Er de to formler logisk ækvivalente?\n\n$$${tex(l)} \\quad\\text{og}\\quad ${tex(r)}$$`,
      hint: 'To formler er ækvivalente, hvis de har samme sandhedsværdi i *hver* række. Én række, hvor de er forskellige, er nok til at vise, at de ikke er det.',
      solution: `${truthTable(names, [
        { label: `$${tex(l)}$`, f: l },
        { label: `$${tex(r)}$`, f: r },
      ])}\n\n${eq ? '**Ja**, de to kolonner er ens i alle rækker, så formlerne er ækvivalente.' : `**Nej.** Fx med ${names.map((x) => `$${x}$ = ${SF(counter![x])}`).join(', ')} er venstre side ${SF(ev(l, counter!))} og højre side ${SF(ev(r, counter!))}.`}`,
      check: { type: 'choice', options: ['Ja, de er ækvivalente', 'Nej, de er ikke ækvivalente'], correct: eq ? 0 : 1 },
    }
  },
})
