Volatiliteten er standardafvigelsen af afkastene. Med $n$ daglige afkast og gennemsnittet $\bar r$ er stikprøvens standardafvigelse
$$s = \sqrt{\frac{1}{n-1}\sum_{t=1}^{n} (r_t - \bar r)^2}.$$
Med 252 handelsdage om året er den årlige volatilitet $s\sqrt{252}$.

**Input:** Første linje er $n$. Anden linje er de $n$ daglige afkast.

**Output:** To linjer: den daglige og den årlige volatilitet, begge med 6 decimaler.

**Grænser:** $2 \le n \le 10^5$, $|r_t| < 1$.
