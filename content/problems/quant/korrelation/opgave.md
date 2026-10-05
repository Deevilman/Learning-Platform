Korrelationen mellem afkastene $x_t$ og $y_t$ fra to aktier er
$$\rho = \frac{\sum_t (x_t - \bar x)(y_t - \bar y)}{\sqrt{\sum_t (x_t - \bar x)^2}\,\sqrt{\sum_t (y_t - \bar y)^2}}.$$
Den ligger mellem $-1$ og $1$ og fortæller, hvor godt diversificering mellem de to virker.

**Input:** Første linje er $n$. Anden linje er $x_1, \dots, x_n$, og tredje linje er $y_1, \dots, y_n$.

**Output:** $\rho$ med 4 decimaler.

**Grænser:** $2 \le n \le 10^5$. Ingen af rækkerne er konstante.
