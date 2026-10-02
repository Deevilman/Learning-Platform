import { defineGenerator } from '@/lib/generators'
import { randomFormula, rows, ev, tex, truthTable, vars } from './_logic'

export default defineGenerator({
  id: 'f-truth-count',
  title: 'Sandhedstabel: hvor mange rækker er sande?',
  course: 'foundations',
  topics: ['propositional-logic'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const names = d === 1 ? ['p', 'q'] : ['p', 'q', 'r']
    const depth = d === 3 ? 3 : 2
    let f = randomFormula(rng, names, depth)
    for (let i = 0; i < 20 && vars(f).size < names.length; i++) f = randomFormula(rng, names, depth)
    const used = names.filter((n) => vars(f).has(n))
    const all = rows(used)
    const t = all.filter((a) => ev(f, a)).length
    const kind = t === all.length ? 'en **tautologi**' : t === 0 ? 'en **kontradiktion**' : '**opfyldelig**, men ikke en tautologi'
    return {
      prompt: `Betragt formlen\n\n$$${tex(f)}$$\n\nI hvor mange af de $${all.length}$ rækker i sandhedstabellen er formlen **sand**?`,
      hint: `Lav en kolonne for hver delformel, indefra og ud. Husk: $a \\to b$ er kun falsk, når $a$ er S og $b$ er F.`,
      solution: `Sandhedstabellen (S = sand, F = falsk):\n\n${truthTable(used, [{ label: `$${tex(f)}$`, f }])}\n\nFormlen er sand i **${t}** af ${all.length} rækker, så den er ${kind}.`,
      check: { type: 'numeric', answer: t, tolerance: 0 },
    }
  },
})
