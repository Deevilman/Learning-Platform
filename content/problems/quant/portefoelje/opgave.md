En portefølje har vægtene $w_1, \dots, w_n$ i $n$ aktiver med forventede afkast $\mu_i$ og kovariansmatrix $\Sigma$. Porteføljens forventede afkast og volatilitet er
$$\mu_P = \sum_i w_i \mu_i, \qquad \sigma_P = \sqrt{\sum_i \sum_j w_i w_j \Sigma_{ij}}.$$

**Input:** Første linje er $n$. Anden linje er vægtene, tredje linje de forventede afkast, og så følger $n$ linjer med kovariansmatricen.

**Output:** To linjer: $\mu_P$ og $\sigma_P$, begge med 6 decimaler.

**Grænser:** $1 \le n \le 200$.
