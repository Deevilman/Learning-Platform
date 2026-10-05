RiskMetrics-modellen giver nyere afkast mere vægt, når volatiliteten skal estimeres. Variansen opdateres dag for dag:
$$\sigma_1^2 = r_1^2, \qquad \sigma_t^2 = \lambda\,\sigma_{t-1}^2 + (1-\lambda)\,r_t^2 \quad (t \ge 2).$$

**Input:** Første linje er $n$ og $\lambda$. Anden linje er de $n$ daglige afkast.

**Output:** To linjer: den sidste daglige volatilitet $\sigma_n$ med 6 decimaler og den årlige $\sigma_n\sqrt{252}$ med 4 decimaler.

**Grænser:** $1 \le n \le 10^5$, $0 < \lambda < 1$.
