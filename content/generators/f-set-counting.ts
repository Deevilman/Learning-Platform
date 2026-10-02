import { defineGenerator, binom } from '@/lib/generators'

export default defineGenerator({
  id: 'f-set-counting',
  title: 'Potensmængder, produkter og delmængder',
  course: 'foundations',
  topics: ['sets-functions'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const a = rng.int(2, d === 1 ? 5 : 6)
    const b = rng.int(2, 5)
    const kinds =
      d === 1
        ? ['P(A)', 'AxB']
        : d === 2
          ? ['P(AxB)', 'k-subsets', 'relations']
          : ['P(P(A))', 'reflexive', 'subsets-containing']
    const kind = rng.pick(kinds)
    let q = ''
    let ans = 0
    let sol = ''
    switch (kind) {
      case 'P(A)':
        q = `$|A| = ${a}$. Hvor mange elementer har potensmængden $\\mathcal{P}(A)$?`
        ans = 2 ** a
        sol = `Hver delmængde svarer til et valg "med/uden" for hvert af de $${a}$ elementer: $|\\mathcal{P}(A)| = 2^{${a}} = ${ans}$.`
        break
      case 'AxB':
        q = `$|A| = ${a}$ og $|B| = ${b}$. Hvor mange elementer har $A \\times B$?`
        ans = a * b
        sol = `$A \\times B$ består af alle ordnede par $(x, y)$ med $x \\in A$, $y \\in B$: $|A \\times B| = ${a} \\cdot ${b} = ${ans}$.`
        break
      case 'P(AxB)':
        q = `$|A| = ${a}$ og $|B| = ${b}$. Hvor mange delmængder har $A \\times B$?`
        ans = 2 ** (a * b)
        sol = `$|A \\times B| = ${a * b}$, så $|\\mathcal{P}(A \\times B)| = 2^{${a * b}} = ${ans}$.`
        break
      case 'k-subsets': {
        const n = rng.int(5, 10)
        const k = rng.int(2, n - 2)
        q = `Hvor mange delmængder med præcis $${k}$ elementer har en mængde med $${n}$ elementer?`
        ans = binom(n, k)
        sol = `Det er binomialkoefficienten $\\binom{${n}}{${k}} = \\frac{${n}!}{${k}!\\,${n - k}!} = ${ans}$.`
        break
      }
      case 'relations':
        q = `$|A| = ${a}$. Hvor mange binære relationer findes der på $A$ (dvs. delmængder af $A \\times A$)?`
        ans = 2 ** (a * a)
        sol = `En relation er en delmængde af $A \\times A$, som har $${a}^2 = ${a * a}$ elementer. Altså $2^{${a * a}} = ${ans}$ relationer.`
        break
      case 'P(P(A))': {
        const s = rng.int(1, 3)
        q = `$|A| = ${s}$. Hvor mange elementer har $\\mathcal{P}(\\mathcal{P}(A))$?`
        ans = 2 ** (2 ** s)
        sol = `$|\\mathcal{P}(A)| = 2^{${s}} = ${2 ** s}$, så $|\\mathcal{P}(\\mathcal{P}(A))| = 2^{${2 ** s}} = ${ans}$.`
        break
      }
      case 'reflexive': {
        const n = rng.int(2, 4)
        q = `$|A| = ${n}$. Hvor mange **refleksive** relationer findes der på $A$?`
        ans = 2 ** (n * n - n)
        sol = `En refleksiv relation skal indeholde de $${n}$ par $(x, x)$. De øvrige $${n}^2 - ${n} = ${n * n - n}$ par kan frit være med eller ej: $2^{${n * n - n}} = ${ans}$.`
        break
      }
      default: {
        const n = rng.int(4, 9)
        const k = rng.int(1, 3)
        q = `$A = \\{1, 2, \\dots, ${n}\\}$. Hvor mange delmængder af $A$ indeholder alle tallene $1, \\dots, ${k}$?`
        ans = 2 ** (n - k)
        sol = `De $${k}$ faste tal skal være med; de resterende $${n - k}$ elementer vælges frit: $2^{${n - k}} = ${ans}$.`
      }
    }
    return { prompt: q, hint: 'Tæl valgmuligheder: for hvert element/par — med eller ikke med?', solution: `${sol}\n\nSvar: **${ans}**.`, check: { type: 'numeric', answer: ans, tolerance: 0 } }
  },
})
