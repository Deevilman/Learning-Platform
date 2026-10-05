Sharpe-ratioen måler afkast i forhold til risiko. Med daglige afkast $r_t$ og en daglig risikofri rente $r_f$ ser man på merafkastet $x_t = r_t - r_f$. Den årlige Sharpe-ratio er
$$SR = \frac{\bar x}{s_x}\sqrt{252},$$
hvor $\bar x$ er gennemsnittet og $s_x$ stikprøvens standardafvigelse (med $n-1$) af merafkastene.

**Input:** Første linje er $n$ og $r_f$. Anden linje er de $n$ daglige afkast.

**Output:** Sharpe-ratioen med 4 decimaler.

**Grænser:** $2 \le n \le 10^5$. Afkastene er ikke alle ens.
