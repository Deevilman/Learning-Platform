Har en strategi et positivt gennemsnitligt afkast, eller er det bare held? Med $n$ daglige afkast, gennemsnittet $\bar r$ og stikprøvens standardafvigelse $s$ (med $n-1$) er t-værdien
$$t = \frac{\bar r}{s/\sqrt{n}}.$$
Hvis $|t| > 1.96$, regner vi afkastet for signifikant forskelligt fra 0 (på 5 %-niveau, når $n$ er stor).

**Input:** Første linje er $n$. Anden linje er de $n$ afkast.

**Output:** To linjer: $t$ med 4 decimaler og derefter `signifikant` eller `ikke signifikant`.

**Grænser:** $2 \le n \le 10^5$. Afkastene er ikke alle ens.
