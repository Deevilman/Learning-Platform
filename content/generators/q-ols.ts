import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-ols',
  title: 'Lineær regression (OLS) i hånden',
  course: 'quant',
  topics: ['linalg-regression', 'factors'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const n = d === 1 ? 4 : 5
    const xs = rng.sample([-3, -2, -1, 0, 1, 2, 3, 4, 5], n).sort((a, b) => a - b)
    const b0 = rng.int(-3, 3)
    const b1 = rng.int(-2, 3) || 1
    const ys = xs.map((x) => b0 + b1 * x + (d === 1 ? 0 : rng.int(-2, 2)))
    const mx = xs.reduce((a, b) => a + b, 0) / n
    const my = ys.reduce((a, b) => a + b, 0) / n
    const sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
    const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
    const beta = sxy / sxx
    const alpha = my - beta * mx
    const syy = ys.reduce((s, y) => s + (y - my) ** 2, 0)
    const r2 = syy ? (sxy * sxy) / (sxx * syy) : 1
    const table = `| $x$ | ${xs.join(' | ')} |\n|:-:|${xs.map(() => ':-:').join('|')}|\n| $y$ | ${ys.join(' | ')} |`
    const ask = d === 3 ? 'R²' : 'ab'
    return {
      prompt: `Tilpas $y = \\alpha + \\beta x$ med mindste kvadraters metode til data:\n\n${table}\n\n${ask === 'ab' ? 'Angiv $\\alpha$ og $\\beta$ adskilt af semikolon (4 decimaler).' : 'Angiv forklaringsgraden $R^2$ (4 decimaler).'}`,
      hint: '$\\hat\\beta = S_{xy}/S_{xx}$ og $\\hat\\alpha = \\bar y - \\hat\\beta \\bar x$; $R^2 = S_{xy}^2/(S_{xx}S_{yy})$.',
      solution: `$\\bar x = ${tex(mx, 4)}$, $\\bar y = ${tex(my, 4)}$, $S_{xy} = ${tex(sxy, 4)}$, $S_{xx} = ${tex(sxx, 4)}$, $S_{yy} = ${tex(syy, 4)}$.\n\n$\\hat\\beta = ${tex(sxy, 4)}/${tex(sxx, 4)} = ${tex(beta, 4)}$, $\\hat\\alpha = ${tex(my, 4)} - ${tex(beta, 4)} \\cdot ${tex(mx, 4)} = ${tex(alpha, 4)}$, $R^2 = ${tex(r2, 4)}$.\n\nSvar: **${ask === 'ab' ? `${da(alpha, 4)}; ${da(beta, 4)}` : da(r2, 4)}**.`,
      check: ask === 'ab' ? { type: 'numeric-list', answers: [Number(alpha.toFixed(4)), Number(beta.toFixed(4))], tolerance: 0.001 } : { type: 'numeric', answer: Number(r2.toFixed(4)), tolerance: 0.001 },
    }
  },
})
