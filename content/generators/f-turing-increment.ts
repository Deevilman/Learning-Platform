import { defineGenerator } from '@/lib/generators'

// The binary-increment Turing machine from week 10: move right to the end,
// then add 1 with carry while moving left.
export default defineGenerator({
  id: 'f-turing-increment',
  title: 'Turing-maskine: binær optælling',
  course: 'foundations',
  topics: ['computability'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const bits = d === 1 ? rng.int(3, 4) : d === 2 ? rng.int(4, 6) : rng.int(6, 8)
    // Make carries likely: end in a run of 1s.
    let n = rng.int(1, 2 ** bits - 1)
    if (rng.chance(0.6)) n |= (1 << rng.int(1, Math.min(3, bits))) - 1
    const input = n.toString(2)
    const out = (n + 1).toString(2)
    const ones = input.length - input.replace(/1+$/, '').length
    // Steps: |w| moves right + 1 move onto the blank, then one step per trailing 1, plus the final write.
    const steps = input.length + 1 + ones + 1
    const ask = d === 3 ? 'steps' : 'output'
    const machine = `| tilstand | læser | skriv | flyt | ny tilstand |\n|:-:|:-:|:-:|:-:|:-:|\n| $R$ | 0 | 0 | → | $R$ |\n| $R$ | 1 | 1 | → | $R$ |\n| $R$ | ␣ | ␣ | ← | $C$ |\n| $C$ | 1 | 0 | ← | $C$ |\n| $C$ | 0 | 1 | – | $H$ |\n| $C$ | ␣ | 1 | – | $H$ |`
    return {
      prompt: `Turing-maskinen nedenfor starter i tilstand $R$ på det første symbol af input. ␣ er blank, $H$ er stop.\n\n${machine}\n\nInput: \`${input}\`. ${ask === 'output' ? 'Hvad står der på båndet, når maskinen stopper? (Skriv bitstrengen.)' : 'Hvor mange skridt (overgange) tager maskinen, før den stopper?'}`,
      hint: 'Tilstand $R$ løber til højre til første blanke felt. Tilstand $C$ lægger 1 til med mente, mens den går til venstre.',
      solution: `$R$ går ${input.length} skridt til højre over \`${input}\` og ét skridt mere, hvor den læser ␣ og går tilbage (${input.length + 1} skridt). $C$ vender så ${ones} afsluttende 1-tal til 0 (${ones} skridt) og skriver til sidst 1 (1 skridt).\n\nResultat på båndet: \`${out}\` (${n} + 1 = ${n + 1}). Antal skridt: ${input.length + 1} + ${ones} + 1 = **${steps}**.${ask === 'output' ? `\n\nSvar: **${out}**` : ''}`,
      check: ask === 'output' ? { type: 'text', answers: [out] } : { type: 'numeric', answer: steps, tolerance: 0 },
    }
  },
})
