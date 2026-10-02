import { defineGenerator } from '@/lib/generators'

const SETS: { s: string; a: 0 | 1 | 2; why: string; d: 1 | 2 | 3 }[] = [
  { s: '$\\mathbb{Z}$', a: 1, why: 'Ræk tallene op som $0, 1, -1, 2, -2, \\dots$ — det er en bijektion med $\\mathbb{N}$.', d: 1 },
  { s: '$\\mathbb{Q}$', a: 1, why: 'Cantors zigzag gennem tabellen af brøker $p/q$ (spring gentagelser over) giver en opremsning.', d: 1 },
  { s: '$\\mathbb{R}$', a: 2, why: 'Cantors diagonalargument: enhver liste af reelle tal mangler et tal.', d: 1 },
  { s: '$\\{0, 1, \\dots, 10^{100}\\}$', a: 0, why: 'Mængden har $10^{100} + 1$ elementer — stort, men endeligt.', d: 1 },
  { s: '$\\mathbb{N} \\times \\mathbb{N}$', a: 1, why: 'Cantors parringsfunktion $\\pi(x,y) = \\frac{(x+y)(x+y+1)}{2} + y$ er en bijektion til $\\mathbb{N}$.', d: 1 },
  { s: '$\\mathcal{P}(\\mathbb{N})$', a: 2, why: 'Cantors sætning: der er ingen surjektion $\\mathbb{N} \\to \\mathcal{P}(\\mathbb{N})$.', d: 2 },
  { s: 'mængden af endelige delmængder af $\\mathbb{N}$', a: 1, why: 'En endelig mængde $S$ kan kodes som $\\sum_{n \\in S} 2^n$ — en bijektion til $\\mathbb{N}$.', d: 2 },
  { s: 'mængden af alle Python-programmer', a: 1, why: 'Programmer er endelige strenge over et endeligt alfabet; ordn dem efter længde og så alfabetisk.', d: 2 },
  { s: 'mængden af uendelige 0/1-følger', a: 2, why: 'Diagonalargumentet; den er i bijektion med $\\mathcal{P}(\\mathbb{N})$.', d: 2 },
  { s: 'intervallet $(0, 1)$', a: 2, why: 'Det er i bijektion med $\\mathbb{R}$ (fx via $x \\mapsto \\tan(\\pi(x - \\tfrac12))$).', d: 2 },
  { s: 'mængden af algebraiske tal', a: 1, why: 'Der er tælleligt mange heltalspolynomier, og hvert har endeligt mange rødder.', d: 3 },
  { s: 'mængden af transcendente reelle tal', a: 2, why: '$\\mathbb{R}$ er overtællelig, og de algebraiske tal er tællelige; så resten må være overtællelig.', d: 3 },
  { s: 'mængden af funktioner $\\mathbb{N} \\to \\{0, 1\\}$', a: 2, why: 'Det er netop de uendelige 0/1-følger — diagonalargumentet.', d: 3 },
  { s: 'mængden af beregnelige reelle tal', a: 1, why: 'Hvert beregneligt tal har (mindst) et program, og der er kun tælleligt mange programmer.', d: 3 },
  { s: 'mængden af funktioner $\\{0,1\\} \\to \\mathbb{N}$', a: 1, why: 'En sådan funktion er et par $(f(0), f(1)) \\in \\mathbb{N}^2$, og $\\mathbb{N}^2$ er tællelig.', d: 3 },
  { s: 'mængden af alle sætninger, ZFC kan bevise', a: 1, why: 'Hver sætning er en endelig streng; der er tælleligt mange strenge.', d: 3 },
  { s: 'mængden af primtal', a: 1, why: 'Der er uendeligt mange primtal (Euklid), og som delmængde af $\\mathbb{N}$ er mængden tællelig.', d: 1 },
  { s: '$\\mathbb{Q} \\cap [0, 1]$', a: 1, why: 'En uendelig delmængde af den tællelige mængde $\\mathbb{Q}$.', d: 2 },
]
const OPTIONS = ['Endelig', 'Tællelig uendelig', 'Overtællelig']

export default defineGenerator({
  id: 'f-countability',
  title: 'Endelig, tællelig eller overtællelig?',
  course: 'foundations',
  topics: ['infinity'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const s = rng.pick(SETS.filter((x) => x.d <= d && (d === 1 || x.d >= d - 1)))
    return {
      prompt: `Hvor stor er ${s.s}?`,
      hint: 'Kan du ramse elementerne op i en liste (tællelig)? Eller kan et diagonalargument bruges (overtællelig)?',
      solution: `**${OPTIONS[s.a]}.** ${s.why}`,
      check: { type: 'choice', options: OPTIONS, correct: s.a },
    }
  },
})
