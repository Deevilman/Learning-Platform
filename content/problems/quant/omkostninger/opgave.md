En backtest uden omkostninger er for optimistisk. På dag $t$ holder du vægten $w_t$ i aktivet, som giver afkastet $r_t$. Før dag 1 er vægten 0. Hver gang du ændrer vægten, betaler du $c$ gange omsætningen $|w_t - w_{t-1}|$. Dagens nettoafkast er
$$x_t = w_t r_t - c\,|w_t - w_{t-1}|.$$

**Input:** Første linje er $n$ og $c$. Så følger $n$ linjer med $w_t$ og $r_t$.

**Output:** Tre linjer:
1. bruttoafkastet $\prod_t (1 + w_t r_t) - 1$ med 6 decimaler,
2. nettoafkastet $\prod_t (1 + x_t) - 1$ med 6 decimaler,
3. den samlede omsætning $\sum_t |w_t - w_{t-1}|$ med 4 decimaler.

**Grænser:** $1 \le n \le 10^5$, $0 \le c \le 0.01$, $|w_t| \le 2$.
