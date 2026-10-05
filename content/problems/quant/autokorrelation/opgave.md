Autokorrelationen ved forsinkelse (lag) $k$ måler, om i dag ligner dagen for $k$ dage siden:
$$\hat\rho(k) = \frac{\sum_{t=k+1}^{n} (x_t - \bar x)(x_{t-k} - \bar x)}{\sum_{t=1}^{n} (x_t - \bar x)^2}.$$
Positiv autokorrelation i afkast tyder på momentum, negativ på mean reversion.

**Input:** Første linje er $n$ og $L$. Anden linje er $x_1, \dots, x_n$.

**Output:** $L$ linjer med $\hat\rho(1), \dots, \hat\rho(L)$, alle med 4 decimaler.

**Grænser:** $2 \le n \le 10^5$, $1 \le L \le \min(n-1, 20)$. Rækken er ikke konstant.
