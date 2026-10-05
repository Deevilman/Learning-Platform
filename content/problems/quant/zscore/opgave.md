I en faktormodel sammenligner man et signal (fx momentum eller værdi) på tværs af aktier ved at standardisere det:
$$z_i = \frac{x_i - \bar x}{\sigma},$$
hvor $\bar x$ er gennemsnittet og $\sigma$ standardafvigelsen over alle $n$ aktier, her med $n$ i nævneren (populationens standardafvigelse).

**Input:** Første linje er $n$. Så følger $n$ linjer med navn og signal $x_i$.

**Output:** Først $n$ linjer med navn og $z_i$ (4 decimaler) i samme rækkefølge som input. Derefter linjen `lang: X`, hvor X er aktien med størst z, og linjen `kort: Y` med den mindste. Er der flere, så tag den første i input.

**Grænser:** $2 \le n \le 10^5$. Signalerne er ikke alle ens.
