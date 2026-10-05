Kvantilen $Q(q)$ af data $x_1, \dots, x_n$ findes sådan her (det er også det, `numpy.quantile` gør):

1. Sortér data, så $x_{(0)} \le x_{(1)} \le \dots \le x_{(n-1)}$ (nummereret fra 0).
2. Sæt $h = (n-1)q$ og $j = \lfloor h \rfloor$.
3. Hvis $j = n-1$, er $Q(q) = x_{(n-1)}$. Ellers er $Q(q) = x_{(j)} + (h - j)\,(x_{(j+1)} - x_{(j)})$.

**Input:** Første linje er $n$. Anden linje er data. Tredje linje er $m$, og fjerde linje er $m$ værdier af $q$.

**Output:** $m$ linjer med $Q(q)$ i samme rækkefølge som input, med 4 decimaler.

**Grænser:** $1 \le n \le 10^5$, $1 \le m \le 100$, $0 \le q \le 1$.
