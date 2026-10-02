import { defineGenerator } from '@/lib/generators'
import { parse, normalize, churchValue, show } from '@/lib/lambda'

export default defineGenerator({
  id: 'f-church-numerals',
  title: 'λ-kalkyle: Church-tal',
  course: 'foundations',
  topics: ['type-theory', 'computability'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    let expr = ''
    if (d === 1) expr = rng.pick([`SUCC ${rng.int(0, 4)}`, `PLUS ${rng.int(0, 3)} ${rng.int(1, 3)}`])
    else if (d === 2) expr = rng.pick([`MULT ${rng.int(1, 3)} ${rng.int(2, 3)}`, `PLUS (SUCC ${rng.int(0, 2)}) ${rng.int(1, 3)}`])
    else expr = rng.pick([`POW ${rng.int(2, 3)} ${rng.int(1, 2)}`, `MULT (PLUS 1 ${rng.int(1, 2)}) ${rng.int(2, 3)}`, `SUCC (MULT ${rng.int(1, 2)} ${rng.int(2, 3)})`])
    const t = parse(expr)
    const { steps } = normalize(t, 2000)
    const nf = steps[steps.length - 1]
    const val = churchValue(nf)!
    const shown = steps.length <= 8 ? steps : [...steps.slice(0, 4), null, ...steps.slice(-2)]
    return {
      prompt: `Med de sædvanlige Church-kodninger\n\n- $\\overline{n} = \\lambda f.\\lambda x.\\, f^n\\,x$\n- $\\mathsf{SUCC} = \\lambda n\\,f\\,x.\\, f\\,(n\\,f\\,x)$, $\\mathsf{PLUS} = \\lambda m\\,n\\,f\\,x.\\, m\\,f\\,(n\\,f\\,x)$\n- $\\mathsf{MULT} = \\lambda m\\,n\\,f.\\, m\\,(n\\,f)$, $\\mathsf{POW} = \\lambda b\\,e.\\, e\\,b$\n\nhvilket Church-tal er normalformen af \`${expr}\`?`,
      hint: 'Du behøver ikke reducere alt i hånden: $\\mathsf{PLUS}\\,\\overline{m}\\,\\overline{n}$ giver $\\overline{m+n}$, $\\mathsf{MULT}$ giver produktet, og $\\mathsf{POW}\\,\\overline{b}\\,\\overline{e}$ giver $\\overline{b^e}$.',
      solution: `Normal-orden-reduktion (${steps.length - 1} β-skridt):\n\n${shown.map((s) => (s ? `- \`${show(s)}\`` : '- …')).join('\n')}\n\nNormalformen er $\\overline{${val}}$, altså **${val}**.`,
      check: { type: 'numeric', answer: val, tolerance: 0 },
    }
  },
})
