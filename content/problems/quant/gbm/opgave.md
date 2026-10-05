I Black–Scholes-modellen følger en aktie en geometrisk brownsk bevægelse med drift $\mu$ og volatilitet $\sigma$:
$$S_T = S_0 \exp\!\left(\left(\mu - \tfrac12\sigma^2\right)T + \sigma W_T\right), \qquad W_T \sim N(0, T).$$
Så er
$$E[S_T] = S_0 e^{\mu T}, \qquad \text{medianen af } S_T = S_0 e^{(\mu - \sigma^2/2)T}, \qquad P(S_T > S_0) = \Phi\!\left(\frac{(\mu - \sigma^2/2)\sqrt{T}}{\sigma}\right),$$
hvor $\Phi$ er fordelingsfunktionen for standardnormalfordelingen: $\Phi(x) = \tfrac12\left(1 + \operatorname{erf}(x/\sqrt2)\right)$.

**Input:** Én linje med $S_0$, $\mu$, $\sigma$ og $T$ (i år).

**Output:** Tre linjer: $E[S_T]$, medianen og $P(S_T > S_0)$, alle med 4 decimaler.

**Grænser:** $0 < S_0 \le 10^4$, $|\mu| \le 1$, $0 < \sigma \le 2$, $0 < T \le 30$.
