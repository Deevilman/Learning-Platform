import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'h-margin-call',
  title: 'Gearing og margin call',
  course: 'hedgefund',
  topics: ['risk-leverage'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const E = rng.pick([10, 20, 50, 100]) // equity
    const lev = d === 3 ? rng.pick([2, 3, 4, 5]) : rng.pick([2, 3, 4, 5, 8, 10])
    const A = E * lev
    const B = A - E
    if (d === 1) {
      const drop = rng.int(2, 15) / 100
      const ret = (-drop * A) / E
      return {
        prompt: `En fond har egenkapital $${E}$ mio. og køber aktiver for $${A}$ mio. (gearing $${lev}\\times$, resten er lånt). Aktiverne falder $${tex(drop * 100, 0)}\\,\\%$. Hvad er afkastet på egenkapitalen i % (2 decimaler)?`,
        hint: 'Tabet rammer først egenkapitalen: afkast = gearing × aktivafkast (ignorér rente).',
        solution: `Tab $= ${tex(drop, 2)} \\cdot ${A} = ${tex(drop * A, 2)}$ mio., dvs. $${tex(ret * 100, 2)}\\,\\%$ af egenkapitalen (= $${lev} \\times ${tex(-drop * 100, 0)}\\,\\%$).\n\nSvar: **${da(ret * 100, 2)} %**.`,
        check: { type: 'numeric', answer: Number((ret * 100).toFixed(2)), tolerance: 0.01, unit: '%' },
      }
    }
    if (d === 2) {
      const wipe = (1 / lev) * 100
      return {
        prompt: `Med gearing $${lev}\\times$ (aktiver = ${lev} × egenkapital): hvor stort et procentvis fald i aktiverne udsletter hele egenkapitalen (2 decimaler)?`,
        hint: 'Egenkapitalen er $1/L$ af aktiverne.',
        solution: `Egenkapital/aktiver $= 1/${lev}$, så et fald på $${tex(wipe, 2)}\\,\\%$ udsletter den.\n\nSvar: **${da(wipe, 2)} %**.`,
        check: { type: 'numeric', answer: Number(wipe.toFixed(2)), tolerance: 0.01, unit: '%' },
      }
    }
    const mm = rng.pick([0.1, 0.15, 0.2, 0.25].filter((x) => x < 1 / lev - 0.02))
    // margin call when (A(1-x) - B) / (A(1-x)) < mm  ⇔  1 - x < B / (A (1 - mm))
    const x = (1 - B / (A * (1 - mm))) * 100
    return {
      prompt: `En position: aktiver $${A}$ mio., lån $${B}$ mio., egenkapital $${E}$ mio. Prime brokeren kræver en vedligeholdelsesmargin på $${tex(mm * 100, 0)}\\,\\%$ (egenkapital/aktiver). Hvor stort et procentvis fald i aktiverne udløser et margin call (2 decimaler)?`,
      hint: 'Efter et fald $x$: aktiver $A(1-x)$, egenkapital $A(1-x) - B$. Løs $\\frac{A(1-x) - B}{A(1-x)} = $ kravet.',
      solution: `$\\frac{A(1-x) - B}{A(1-x)} = ${tex(mm, 2)} \\iff 1 - x = \\frac{B}{A(1 - ${tex(mm, 2)})} = \\frac{${B}}{${tex(A * (1 - mm), 2)}}$, så $x = ${tex(x, 2)}\\,\\%$.\n\nSvar: **${da(x, 2)} %**.`,
      check: { type: 'numeric', answer: Number(x.toFixed(2)), tolerance: 0.01, unit: '%' },
    }
  },
})
