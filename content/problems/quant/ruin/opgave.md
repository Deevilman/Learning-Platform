En trader starter med $i$ enheder og handler én enhed ad gangen. Hver handel vinder én enhed med sandsynlighed $p$ og taber én enhed ellers. Hun stopper, når hun når $N$ enheder (målet) eller 0 (ruin). Sandsynligheden for at nå målet er
$$P = \begin{cases} \dfrac{i}{N}, & p = \tfrac12,\\[2mm] \dfrac{1-\rho^{i}}{1-\rho^{N}}, & p \ne \tfrac12,\end{cases} \qquad \rho = \frac{1-p}{p}.$$

**Input:** Én linje med $i$, $N$ og $p$.

**Output:** Sandsynligheden for at nå målet med 6 decimaler.

**Grænser:** $0 < i < N \le 200$ (heltal), $0.3 \le p \le 0.7$.
