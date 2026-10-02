import { defineGenerator } from '@/lib/generators'

const PRIMES = [2, 3, 5, 7, 11, 13]
const SUP = (ps: number[], es: number[]) => es.map((e, i) => `${ps[i]}^{${e}}`).join(' \\cdot ')

export default defineGenerator({
  id: 'f-godel-numbering',
  title: 'Gödel-nummerering med primtalspotenser',
  course: 'foundations',
  topics: ['godel'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const len = d === 1 ? 2 : 3
    const es = Array.from({ length: len }, () => rng.int(1, d === 3 ? 4 : 3))
    const g = es.reduce((acc, e, i) => acc * PRIMES[i] ** e, 1)
    if (d < 3) {
      return {
        prompt: `Følgen af symbolkoder $(${es.join(', ')})$ kodes som $\\ulcorner s \\urcorner = ${PRIMES.slice(0, len).map((p, i) => `${p}^{s_${i + 1}}`).join(' \\cdot ')}$. Beregn Gödel-nummeret.`,
        hint: 'Gang primtalspotenserne sammen.',
        solution: `$${SUP(PRIMES, es)} = ${es.map((e, i) => PRIMES[i] ** e).join(' \\cdot ')} = ${g}$. Svar: **${g}**.`,
        check: { type: 'numeric', answer: g, tolerance: 0 },
      }
    }
    return {
      prompt: `Gödel-nummeret for en følge $(s_1, s_2, s_3)$ er $2^{s_1} 3^{s_2} 5^{s_3}$. Hvilken følge har nummeret $${g}$? Skriv de tre tal adskilt af semikolon.`,
      hint: 'Aritmetikkens fundamentalsætning: faktoriseringen er entydig. Divider gentagne gange med 2, så 3, så 5.',
      solution: `$${g} = ${SUP(PRIMES, es)}$ (entydig primfaktorisering), så følgen er **${es.join('; ')}**. Det er netop entydigheden, der gør, at man kan *afkode* et Gödel-nummer.`,
      check: { type: 'numeric-list', answers: es, tolerance: 0 },
    }
  },
})
