Når de daglige afkast er $r_1, \dots, r_n$, er det samlede afkast
$$R = (1+r_1)(1+r_2)\cdots(1+r_n) - 1,$$
og det samlede log-afkast er summen
$$\ell = \sum_{t=1}^{n} \ln(1+r_t).$$
Log-afkast kan altså lægges sammen, og $R = e^{\ell} - 1$.

**Input:** Første linje er $n$. Anden linje er de $n$ daglige afkast.

**Output:** To linjer: $R$ og $\ell$, begge med 6 decimaler.

**Grænser:** $1 \le n \le 10^5$, $-0.5 < r_t \le 1$.
