import { defineGenerator } from '@/lib/generators'

const OPTIONS = ['Hverken injektiv eller surjektiv', 'Injektiv, men ikke surjektiv', 'Surjektiv, men ikke injektiv', 'Bijektiv']

export default defineGenerator({
  id: 'f-function-properties',
  title: 'Injektiv, surjektiv eller bijektiv?',
  course: 'foundations',
  topics: ['sets-functions'],
  difficulties: [1, 2],
  make(rng, d) {
    const n = rng.int(3, d === 1 ? 4 : 5)
    const m = rng.pick([n - 1, n, n, n + 1])
    const target = rng.int(0, 3) // aim for a balanced mix of the four answers
    let f: number[] = []
    for (let tries = 0; tries < 200; tries++) {
      f = Array.from({ length: n }, () => rng.int(1, m))
      if (target === 3 && m === n) f = rng.shuffle(Array.from({ length: n }, (_, i) => i + 1))
      if (target === 1 && m > n) f = rng.sample(Array.from({ length: m }, (_, i) => i + 1), n)
      const inj = new Set(f).size === n
      const sur = new Set(f).size === m
      if ((inj ? 1 : 0) + (sur ? 2 : 0) === target) break
    }
    const inj = new Set(f).size === n
    const sur = new Set(f).size === m
    const ans = (inj ? 1 : 0) + (sur ? 2 : 0)
    const table = `| $x$ | ${f.map((_, i) => i + 1).join(' | ')} |\n|${f.map(() => ':-:').join('|')}|:-:|\n| $f(x)$ | ${f.join(' | ')} |`
    const dup = f.findIndex((y, i) => f.indexOf(y) !== i)
    const missing = Array.from({ length: m }, (_, i) => i + 1).filter((y) => !f.includes(y))
    return {
      prompt: `Funktionen $f : \\{1, \\dots, ${n}\\} \\to \\{1, \\dots, ${m}\\}$ er givet ved tabellen\n\n${table}\n\nHvilke egenskaber har $f$?`,
      hint: 'Injektiv: ingen værdi rammes to gange. Surjektiv: alle værdier i $\\{1,\\dots,' + m + '\\}$ rammes.',
      solution: `- ${inj ? 'Injektiv: alle funktionsværdier er forskellige.' : `Ikke injektiv: $f(${f.indexOf(f[dup]) + 1}) = f(${dup + 1}) = ${f[dup]}$.`}\n- ${sur ? 'Surjektiv: alle tal i dispositionsmængden rammes.' : `Ikke surjektiv: ${missing.map((y) => `$${y}$`).join(', ')} rammes ikke.`}\n\nSvar: **${OPTIONS[ans]}**.${n !== m ? ` (Bemærk: da $${n} \\neq ${m}$, kan $f$ slet ikke være bijektiv.)` : ''}`,
      check: { type: 'choice', options: OPTIONS, correct: ans },
    }
  },
})
