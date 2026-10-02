import { defineGenerator } from '@/lib/generators'

export default defineGenerator({
  id: 'f-dfa-run',
  title: 'Accepterer automaten strengen?',
  course: 'foundations',
  topics: ['computability'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const k = d === 1 ? 2 : 3
    const states = Array.from({ length: k }, (_, i) => `q_${i}`)
    const delta = states.map(() => ({ a: rng.int(0, k - 1), b: rng.int(0, k - 1) }))
    const accept = new Set(rng.sample(states.map((_, i) => i), rng.int(1, k - 1)))
    const len = d === 1 ? rng.int(3, 4) : d === 2 ? rng.int(5, 6) : rng.int(7, 9)
    const w = Array.from({ length: len }, () => rng.pick(['a', 'b'])).join('')
    let q = 0
    const trace = [`q_0`]
    for (const c of w) {
      q = c === 'a' ? delta[q].a : delta[q].b
      trace.push(`q_${q}`)
    }
    const ok = accept.has(q)
    const table = `| tilstand | $a$ | $b$ |\n|:-:|:-:|:-:|\n${states.map((s, i) => `| ${i === 0 ? '→ ' : ''}$${s}$${accept.has(i) ? ' ✓' : ''} | $${states[delta[i].a]}$ | $${states[delta[i].b]}$ |`).join('\n')}`
    const path = trace.map((s, i) => (i === 0 ? `$${s}$` : `$\\xrightarrow{${w[i - 1]}} ${s}$`)).join(' ')
    return {
      prompt: `En DFA over alfabetet $\\{a, b\\}$ har overgangstabellen nedenfor. Starttilstanden er $q_0$ (→), og de accepterende tilstande er markeret med ✓.\n\n${table}\n\nAccepterer automaten strengen \`${w}\`?`,
      hint: 'Start i $q_0$, læs ét symbol ad gangen, og slå den næste tilstand op i tabellen.',
      solution: `Kørslen: ${path}.\n\nDen ender i $q_${q}$, som ${ok ? 'er' : 'ikke er'} accepterende, så strengen bliver **${ok ? 'accepteret' : 'afvist'}**.`,
      check: { type: 'choice', options: ['Ja, den accepteres', 'Nej, den afvises'], correct: ok ? 0 : 1 },
    }
  },
})
