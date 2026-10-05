To aktier, A og B, følges ad. Spreadet er $s_t = A_t - \beta B_t$, hvor hedge-ratioen $\beta$ er givet. Når spreadet er langt fra sit normale niveau, satser man på, at det vender tilbage.

Se på de sidste $k$ spreads $s_{n-k+1}, \dots, s_n$. Beregn deres gennemsnit $m$ og stikprøvens standardafvigelse $sd$ (med $k-1$), og z-scoren for den sidste dag:
$$z = \frac{s_n - m}{sd}.$$
Med tærsklen $e$ er signalet `sælg spread`, hvis $z > e$, `køb spread`, hvis $z < -e$, og ellers `vent`.

**Input:** Første linje er $n$, $k$, $\beta$ og $e$. Anden linje er A's $n$ kurser, tredje linje B's.

**Output:** To linjer: $z$ med 4 decimaler og signalet.

**Grænser:** $2 \le k \le n \le 10^5$. De sidste $k$ spreads er ikke alle ens.
