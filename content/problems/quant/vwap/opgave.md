Den volumenvægtede gennemsnitspris (VWAP) er
$$VWAP = \frac{\sum_i p_i q_i}{\sum_i q_i},$$
hvor handel $i$ har prisen $p_i$ og antallet $q_i$. Store institutioner måles ofte på, om de handler bedre end dagens VWAP.

**Input:** Første linje er $n$. Så følger $n$ linjer med pris og antal.

**Output:** To linjer: VWAP med 4 decimaler og den samlede volumen (et helt tal).

**Grænser:** $1 \le n \le 10^5$, $0 < p_i \le 10^5$, $1 \le q_i \le 10^6$ (hele tal).
