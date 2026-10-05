Find den rette linje $y = \alpha + \beta x$, der passer bedst til punkterne $(x_t, y_t)$ efter mindste kvadraters metode:
$$\beta = \frac{\sum_t (x_t - \bar x)(y_t - \bar y)}{\sum_t (x_t - \bar x)^2}, \qquad \alpha = \bar y - \beta \bar x.$$
Forklaringsgraden er $R^2 = 1 - \frac{\sum_t (y_t - \alpha - \beta x_t)^2}{\sum_t (y_t - \bar y)^2}$.

**Input:** Første linje er $n$. Anden linje er $x_1, \dots, x_n$, tredje linje er $y_1, \dots, y_n$.

**Output:** Tre linjer: $\beta$, $\alpha$ og $R^2$, alle med 4 decimaler.

**Grænser:** $2 \le n \le 10^5$. Hverken $x$ eller $y$ er konstant.
