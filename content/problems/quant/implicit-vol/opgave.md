Markedet oplyser optionens pris, ikke dens volatilitet. Den implicitte volatilitet er den $\sigma$, der får Black–Scholes-prisen til at passe med markedsprisen $C$:
$$C_{BS}(\sigma) = C, \qquad C_{BS}(\sigma) = S\,\Phi(d_1) - K e^{-rT}\Phi(d_2),$$
med $d_1, d_2$ som i Black–Scholes. Call-prisen vokser med $\sigma$, så der er højst én løsning.

**Input:** Én linje med call-prisen $C$, $S$, $K$, $r$ og $T$.

**Output:** Den implicitte volatilitet med 4 decimaler.

**Grænser:** Løsningen ligger mellem $0.01$ og $3$.
