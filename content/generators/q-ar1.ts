import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'q-ar1',
  title: 'AR(1): middelværdi, varians og autokorrelation',
  course: 'quant',
  topics: ['timeseries'],
  difficulties: [1, 2, 3],
  make(rng, d) {
    const c = rng.int(-5, 10) / 10
    const phi = rng.pick([-0.6, -0.3, 0.2, 0.4, 0.5, 0.7, 0.8, 0.9, 0.95])
    const s = rng.int(5, 20) / 10
    const mean = c / (1 - phi)
    const varr = (s * s) / (1 - phi * phi)
    const k = rng.int(2, 5)
    const half = Math.log(0.5) / Math.log(Math.abs(phi))
    const spec = [
      { q: 'den ubetingede middelværdi $E[X_t]$', a: mean, sol: `$\\mu = c/(1-\\phi) = ${tex(c, 1)}/(1 - ${tex(phi, 2)}) = ${tex(mean, 4)}$.`, hint: 'Tag forventning på begge sider og brug stationaritet: $\\mu = c + \\phi\\mu$.' },
      { q: 'den ubetingede varians $\\mathrm{Var}(X_t)$', a: varr, sol: `$\\gamma_0 = \\sigma^2/(1-\\phi^2) = ${tex(s * s, 2)}/(1 - ${tex(phi * phi, 4)}) = ${tex(varr, 4)}$.`, hint: 'Varians på begge sider: $\\gamma_0 = \\phi^2\\gamma_0 + \\sigma^2$.' },
      { q: `autokorrelationen $\\rho(${k})$`, a: phi ** k, sol: `For AR(1) er $\\rho(k) = \\phi^k$, så $\\rho(${k}) = ${tex(phi, 2)}^{${k}} = ${tex(phi ** k, 4)}$.`, hint: 'Gang $X_t - \\mu = \\phi(X_{t-1} - \\mu) + \\varepsilon_t$ med $X_{t-k} - \\mu$ og tag forventning.' },
      { q: 'halveringstiden for et stød (antal perioder, $h$ med $|\\phi|^h = \\tfrac12$)', a: half, sol: `$h = \\ln(0.5)/\\ln|\\phi| = ${tex(Math.log(0.5), 4)}/${tex(Math.log(Math.abs(phi)), 4)} = ${tex(half, 4)}$ perioder.`, hint: 'Et stød på $X$ henfalder som $\\phi^h$.' },
    ]
    const it = spec[d === 1 ? rng.int(0, 1) : d === 2 ? rng.int(1, 2) : rng.int(2, 3)]
    return {
      prompt: `Betragt den stationære AR(1)-proces $X_t = ${tex(c, 1)} ${phi < 0 ? '-' : '+'} ${tex(Math.abs(phi), 2)}\\,X_{t-1} + \\varepsilon_t$ med $\\varepsilon_t$ hvid støj, $\\mathrm{Var}(\\varepsilon_t) = ${tex(s, 1)}^2$. Find ${it.q} (4 decimaler).`,
      hint: it.hint,
      solution: `${it.sol}\n\nSvar: **${da(it.a, 4)}**.`,
      check: { type: 'numeric', answer: Number(it.a.toFixed(4)), tolerance: 0.001 },
    }
  },
})
