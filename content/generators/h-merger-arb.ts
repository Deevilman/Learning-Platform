import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'h-merger-arb',
  title: 'Fusionsarbitrage: spread og implicit sandsynlighed',
  course: 'hedgefund',
  topics: ['event-driven'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const D = rng.int(30, 60) // fall-back price
    const O = D + rng.int(10, 30) // offer
    const P = Number((O - rng.int(5, Math.max(6, Math.round((O - D) * 0.5)))).toFixed(0))
    if (d === 1) {
      const spread = ((O - P) / P) * 100
      return {
        prompt: `Et kontantbud lyder på $${O}$ kr. pr. aktie. Målselskabet handles til $${P}$ kr. Hvad er bruttospreadet i % (2 decimaler)?`,
        hint: 'Spread = (bud − kurs)/kurs.',
        solution: `$(${O} - ${P})/${P} = ${tex(spread, 2)}\\,\\%$.\n\nSvar: **${da(spread, 2)} %**.`,
        check: { type: 'numeric', answer: Number(spread.toFixed(2)), tolerance: 0.01, unit: '%' },
      }
    }
    if (d === 2) {
      const p = (P - D) / (O - D)
      return {
        prompt: `Bud: $${O}$ kr. Kurs i dag: $${P}$ kr. Hvis handlen falder, forventes aktien at falde til $${D}$ kr. Ignorér tidsværdi. Hvilken sandsynlighed (i %, 2 decimaler) for gennemførelse prisfastsætter markedet?`,
        hint: 'Løs $P = p\\,O + (1-p)\\,D$ for $p$.',
        solution: `$p = (P - D)/(O - D) = (${P} - ${D})/(${O} - ${D}) = ${tex(p * 100, 2)}\\,\\%$.\n\nSvar: **${da(p * 100, 2)} %**.`,
        check: { type: 'numeric', answer: Number((p * 100).toFixed(2)), tolerance: 0.01, unit: '%' },
      }
    }
    const months = rng.pick([3, 4, 6, 9])
    const ret = (O / P - 1) * (12 / months) * 100
    return {
      prompt: `Bud $${O}$ kr., kurs $${P}$ kr., forventet gennemførelse om $${months}$ måneder. Hvad er det **annualiserede** (simple) afkast i %, hvis handlen gennemføres (2 decimaler)?`,
      hint: 'Afkast ved gennemførelse × (12 / måneder).',
      solution: `$(${O}/${P} - 1) \\cdot 12/${months} = ${tex(ret, 2)}\\,\\%$. Husk: det er afkastet *givet* gennemførelse; tabet ved brud er typisk meget større (negativ skævhed — "picking up nickels in front of a steamroller").\n\nSvar: **${da(ret, 2)} %**.`,
      check: { type: 'numeric', answer: Number(ret.toFixed(2)), tolerance: 0.01, unit: '%' },
    }
  },
})
