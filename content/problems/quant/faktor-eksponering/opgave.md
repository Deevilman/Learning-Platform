Hver aktie $i$ har en eksponering (beta) $\beta_{ij}$ over for faktor $j$, fx marked, størrelse og værdi. En portefølje med vægtene $w_i$ har eksponeringen
$$B_j = \sum_i w_i \beta_{ij}$$
over for faktor $j$.

**Input:** Første linje er $n$ (aktier) og $k$ (faktorer). Anden linje er vægtene $w_1, \dots, w_n$. Så følger $n$ linjer med $k$ betaer hver.

**Output:** Én linje med $B_1, \dots, B_k$ adskilt af mellemrum, med 4 decimaler.

**Grænser:** $1 \le n \le 1000$, $1 \le k \le 20$.
