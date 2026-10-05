Et drawdown er, hvor meget værdien er faldet fra den hidtil højeste værdi:
$$DD_t = \frac{\max_{s \le t} p_s - p_t}{\max_{s \le t} p_s}.$$
Max drawdown er det største $DD_t$ i perioden: det værste tab, en investor kunne have haft, hvis hun købte på toppen.

**Input:** Første linje er $n$. Anden linje er porteføljens værdi på de $n$ dage.

**Output:** Max drawdown som decimaltal med 4 decimaler, fx `0.2500` for et fald på 25 %.

**Grænser:** $1 \le n \le 2 \cdot 10^5$, $0 < p_t \le 10^9$. Løsningen skal være $O(n)$.
