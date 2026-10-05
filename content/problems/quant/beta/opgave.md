En enfaktor-model skriver aktiens afkast som $r_t = \alpha + \beta m_t + \varepsilon_t$, hvor $m_t$ er markedets afkast. Beta og alfa findes med mindste kvadraters metode:
$$\beta = \frac{\sum_t (m_t - \bar m)(r_t - \bar r)}{\sum_t (m_t - \bar m)^2}, \qquad \alpha = \bar r - \beta\bar m.$$
Den idiosynkratiske volatilitet er standardafvigelsen af residualerne $e_t = r_t - \alpha - \beta m_t$:
$$s_e = \sqrt{\frac{1}{n-2}\sum_t e_t^2}.$$

**Input:** Første linje er $n$. Anden linje er aktiens afkast $r_1, \dots, r_n$, tredje linje markedets $m_1, \dots, m_n$.

**Output:** To linjer: $\beta$ og $s_e$, begge med 4 decimaler.

**Grænser:** $3 \le n \le 10^5$. Markedets afkast er ikke konstante.
