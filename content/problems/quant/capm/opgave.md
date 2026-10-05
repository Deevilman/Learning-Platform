Efter CAPM er det forventede afkast for en aktie med beta $\beta$
$$E[R] = r_f + \beta\,(r_m - r_f),$$
hvor $r_f$ er den risikofri rente og $r_m$ markedets afkast. Alfa er det faktiske afkast minus det forventede: $\alpha = R - E[R]$.

**Input:** Første linje er $r_f$ og $r_m$. Anden linje er $n$. Så følger $n$ linjer med navn, $\beta$ og faktisk afkast $R$.

**Output:** $n$ linjer med navn, $E[R]$ og $\alpha$ (4 decimaler), sorteret efter $\alpha$ fra størst til mindst. Er to alfaer ens, kommer navnene i alfabetisk rækkefølge.

**Grænser:** $1 \le n \le 1000$. Navnene består af bogstaver.
