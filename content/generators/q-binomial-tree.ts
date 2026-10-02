import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-binomial-tree',
  title: 'Binomialmodellen for optioner',
  course: 'quant',
  topics: ['derivatives'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const S = rng.pick([50, 80, 100, 120])
    const u = rng.pick([1.1, 1.15, 1.2, 1.25])
    const dd = Number((1 / u).toFixed(4))
    const r = rng.pick([0, 0.01, 0.02, 0.03]) // per period, simple
    const K = Math.round(S * rng.pick([0.9, 1, 1.05, 1.1]))
    const call = rng.chance(0.6) || d < 3
    const american = d === 3 && !call
    const n = d === 1 ? 1 : 2
    const q = (1 + r - dd) / (u - dd)
    const pay = (s: number) => (call ? Math.max(s - K, 0) : Math.max(K - s, 0))
    // backward induction
    let vals = Array.from({ length: n + 1 }, (_, j) => pay(S * u ** (n - j) * dd ** j))
    const levels: number[][] = [vals]
    for (let step = n - 1; step >= 0; step--) {
      vals = Array.from({ length: step + 1 }, (_, j) => {
        const cont = (q * vals[j] + (1 - q) * vals[j + 1]) / (1 + r)
        return american ? Math.max(cont, pay(S * u ** (step - j) * dd ** j)) : cont
      })
      levels.unshift(vals)
    }
    const price = vals[0]
    return {
      prompt: `En ${n}-periode-binomialmodel: $S_0 = ${S}$, $u = ${tex(u, 2)}$, $d = 1/u = ${tex(dd, 4)}$, risikofri rente $${tex(r * 100, 0)}\\,\\%$ pr. periode. Find prisen på en ${american ? 'amerikansk' : 'europæisk'} ${call ? 'call' : 'put'} med strike $K = ${K}$ og udløb om ${n} periode${n > 1 ? 'r' : ''} (4 decimaler).`,
      hint: 'Risikoneutral sandsynlighed $q = (1 + r - d)/(u - d)$. Diskontér forventet payoff baglæns gennem træet' + (american ? ', og tjek tidlig indfrielse i hver knude.' : '.'),
      solution: `$q = (1 + ${tex(r, 2)} - ${tex(dd, 4)})/(${tex(u, 2)} - ${tex(dd, 4)}) = ${tex(q, 4)}$.\n\n${levels
        .map((lv, t) => `- Tid ${t}: ${lv.map((v, j) => `$S = ${tex(S * u ** (t - j) * dd ** j, 2)}$: værdi $${tex(v, 4)}$`).join(', ')}`)
        .join('\n')}\n\nPris: **${da(price, 4)}**.`,
      check: { type: 'numeric', answer: Number(price.toFixed(4)), tolerance: 0.002 },
    }
  },
})
