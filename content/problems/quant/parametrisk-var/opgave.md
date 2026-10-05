Antager man normalfordelte afkast med daglig middelværdi $\mu$ og standardafvigelse $\sigma$, er VaR for en position på $V$ kroner over $h$ dage
$$VaR = V\left(z\,\sigma\sqrt{h} - \mu h\right),$$
hvor $z$ er kvantilen i standardnormalfordelingen for det ønskede niveau (fx $z = 1.645$ for 95 % og $z = 2.326$ for 99 %).

**Input:** Én linje med $V$, $\mu$, $\sigma$, $h$ og $z$.

**Output:** VaR i kroner med 2 decimaler.

**Grænser:** $0 < V \le 10^9$, $|\mu| \le 0.01$, $0 < \sigma \le 0.1$, $1 \le h \le 250$, $1 \le z \le 4$.
