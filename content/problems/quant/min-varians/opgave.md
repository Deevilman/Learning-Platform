To aktiver har volatiliteterne $\sigma_1$ og $\sigma_2$ og korrelationen $\rho$. Du lægger andelen $w$ i aktiv 1 og $1 - w$ i aktiv 2. Variansen er
$$\sigma_P^2(w) = w^2\sigma_1^2 + (1-w)^2\sigma_2^2 + 2w(1-w)\rho\sigma_1\sigma_2,$$
og den er mindst for
$$w^* = \frac{\sigma_2^2 - \rho\sigma_1\sigma_2}{\sigma_1^2 + \sigma_2^2 - 2\rho\sigma_1\sigma_2}.$$
($w^*$ kan godt være negativ eller større end 1; så sælger man det ene aktiv short.)

**Input:** Én linje med $\sigma_1$, $\sigma_2$ og $\rho$.

**Output:** To linjer: $w^*$ og porteføljens volatilitet $\sigma_P(w^*)$, begge med 4 decimaler.

**Grænser:** $0 < \sigma_1, \sigma_2 \le 2$, $-1 \le \rho \le 1$, og nævneren er større end 0.
