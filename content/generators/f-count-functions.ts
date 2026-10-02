import { defineGenerator, binom } from '@/lib/generators'

function surjections(n: number, m: number) {
  let s = 0
  for (let k = 0; k <= m; k++) s += (-1) ** k * binom(m, k) * (m - k) ** n
  return s
}

export default defineGenerator({
  id: 'f-count-functions',
  title: 'Antal funktioner, injektioner og surjektioner',
  course: 'foundations',
  topics: ['sets-functions'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const kind = d === 1 ? 'all' : d === 2 ? rng.pick(['inj', 'bij']) : 'sur'
    let n = rng.int(2, 5)
    let m = rng.int(2, 5)
    if (kind === 'inj' && n > m) [n, m] = [m, n]
    if (kind === 'bij') m = n
    if (kind === 'sur' && n < m) [n, m] = [m, n]
    if (kind === 'sur' && n === m) n++
    let ans = 0
    let sol = ''
    const what = { all: 'funktioner', inj: 'injektive funktioner', bij: 'bijektioner', sur: 'surjektive funktioner' }[kind]
    if (kind === 'all') {
      ans = m ** n
      sol = `Hvert af de $${n}$ elementer i $A$ kan sendes til et vilkårligt af de $${m}$ elementer i $B$: $${m}^{${n}} = ${ans}$.`
    } else if (kind === 'inj' || kind === 'bij') {
      ans = 1
      const fs: number[] = []
      for (let i = 0; i < n; i++) {
        ans *= m - i
        fs.push(m - i)
      }
      sol = `Første element har $${m}$ muligheder, det næste $${m - 1}$ (det skal ramme en ny værdi), osv.: $${fs.join(' \\cdot ')} = ${ans}$.`
    } else {
      ans = surjections(n, m)
      const terms = Array.from({ length: m + 1 }, (_, k) => `${k % 2 ? '-' : '+'}\\binom{${m}}{${k}}${m - k}^{${n}}`).join(' ').replace(/^\+/, '')
      sol = `Inklusion–eksklusion over de værdier, der *ikke* rammes:\n\n$$\\sum_{k=0}^{${m}} (-1)^k \\binom{${m}}{k} (${m}-k)^{${n}} = ${terms} = ${ans}.$$`
    }
    return {
      prompt: `$|A| = ${n}$ og $|B| = ${m}$. Hvor mange ${what} $f : A \\to B$ findes der?`,
      hint: kind === 'sur' ? 'Tæl alle funktioner, og træk dem fra, der undgår mindst én værdi (inklusion–eksklusion).' : 'Tænk på at vælge $f(a_1), f(a_2), \\dots$ én ad gangen.',
      solution: `${sol}\n\nSvar: **${ans}**.`,
      check: { type: 'numeric', answer: ans, tolerance: 0 },
    }
  },
})
