Et aktiv ender med et af afkastene $x_1, \dots, x_n$ med sandsynlighederne $p_1, \dots, p_n$, som summer til 1. Middelværdi og varians er
$$E[X] = \sum_i p_i x_i, \qquad \mathrm{Var}(X) = \sum_i p_i (x_i - E[X])^2.$$

**Input:** Første linje er $n$. Så følger $n$ linjer med $x_i$ og $p_i$.

**Output:** To linjer: $E[X]$ og $\mathrm{Var}(X)$, begge med 4 decimaler.

**Grænser:** $2 \le n \le 1000$.
