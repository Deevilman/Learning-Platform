import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'h-short-pnl',
  title: 'Short-salg: gevinst, lånegebyr og udbytte',
  course: 'hedgefund',
  topics: ['long-short'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const n = rng.pick([1000, 2000, 5000, 10000])
    const P0 = rng.int(50, 150)
    const P1 = Math.round(P0 * rng.real(0.6, 1.3, 2))
    const fee = rng.pick([0.005, 0.01, 0.03, 0.1, 0.25]) // annual borrow fee
    const months = rng.pick([3, 6, 12])
    const div = d === 3 ? rng.int(1, 4) : 0
    const gross = n * (P0 - P1)
    const borrow = d >= 2 ? n * P0 * fee * (months / 12) : 0
    const divPaid = n * div
    const pnl = gross - borrow - divPaid
    return {
      prompt: `Du shorter $${n}$ aktier til $${P0}$ kr. og lukker positionen ${months} måneder senere til $${P1}$ kr.${d >= 2 ? ` Lånegebyret er $${tex(fee * 100, 1)}\\,\\%$ p.a. af den oprindelige markedsværdi.` : ''}${div ? ` Aktien betaler et udbytte på $${div}$ kr. i perioden, som du skal betale til långiveren.` : ''} Hvad er din samlede gevinst/tab i kr.? (negativ = tab; 2 decimaler)`,
      hint: 'Short-gevinst = antal × (salgskurs − tilbagekøbskurs). Træk lånegebyr og eventuelt udbytte fra.',
      solution: `Kursgevinst: $${n} \\cdot (${P0} - ${P1}) = ${tex(gross, 2)}$.${d >= 2 ? ` Lånegebyr: $${n} \\cdot ${P0} \\cdot ${tex(fee, 3)} \\cdot ${months}/12 = ${tex(borrow, 2)}$.` : ''}${div ? ` Udbytte: $${n} \\cdot ${div} = ${tex(divPaid, 2)}$.` : ''} I alt: $${tex(pnl, 2)}$ kr.${P1 > P0 ? ' Bemærk asymmetrien: en short kan højst tjene 100 %, men tabet er ubegrænset.' : ''}\n\nSvar: **${da(pnl, 2)}**.`,
      check: { type: 'numeric', answer: Number(pnl.toFixed(2)), tolerance: 0.01 },
    }
  },
})
