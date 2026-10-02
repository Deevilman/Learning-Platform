import { defineGenerator } from '@/lib/generators'

const pair = (x: number, y: number) => ((x + y) * (x + y + 1)) / 2 + y

export default defineGenerator({
  id: 'f-cantor-pairing',
  title: 'Cantors parringsfunktion',
  course: 'foundations',
  topics: ['infinity'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const x = rng.int(0, d === 1 ? 5 : 12)
    const y = rng.int(0, d === 1 ? 5 : 12)
    const z = pair(x, y)
    const def = '$\\pi(x, y) = \\frac{(x+y)(x+y+1)}{2} + y$'
    if (d < 3)
      return {
        prompt: `Cantors parringsfunktion ${def} er en bijektion $\\mathbb{N} \\times \\mathbb{N} \\to \\mathbb{N}$. Beregn $\\pi(${x}, ${y})$.`,
        hint: 'Sæt $s = x + y$ (diagonalens nummer). Før diagonal $s$ ligger $\\frac{s(s+1)}{2}$ par.',
        solution: `$s = ${x + y}$, $\\frac{${x + y} \\cdot ${x + y + 1}}{2} = ${((x + y) * (x + y + 1)) / 2}$, plus $y = ${y}$: **${z}**.`,
        check: { type: 'numeric', answer: z, tolerance: 0 },
      }
    let s = 0
    while (((s + 1) * (s + 2)) / 2 <= z) s++
    return {
      prompt: `Med ${def}: find parret $(x, y)$ med $\\pi(x, y) = ${z}$. Skriv $x$ og $y$ adskilt af semikolon.`,
      hint: 'Find den største $s$ med $\\frac{s(s+1)}{2} \\le ' + z + '$. Så er $y = ' + z + ' - \\frac{s(s+1)}{2}$ og $x = s - y$.',
      solution: `Største $s$ med $\\frac{s(s+1)}{2} \\le ${z}$ er $s = ${s}$ (trekanttal $${(s * (s + 1)) / 2}$). Så $y = ${z} - ${(s * (s + 1)) / 2} = ${y}$ og $x = ${s} - ${y} = ${x}$. Svar: **${x}; ${y}**.`,
      check: { type: 'numeric-list', answers: [x, y], tolerance: 0 },
    }
  },
})
