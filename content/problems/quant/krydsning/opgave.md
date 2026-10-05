En klassisk trendstrategi ejer aktien, når det korte glidende gennemsnit ligger over det lange. Med kurserne $p_1, \dots, p_n$ og vinduerne $s < l$:

- For hver dag $t = l, l+1, \dots, n-1$ beregnes $SMA_s(t)$ og $SMA_l(t)$ ud fra kurserne til og med dag $t$.
- Positionen efter lukketid på dag $t$ er $1$, hvis $SMA_s(t) > SMA_l(t)$ (strengt større), og ellers $0$.
- Positionen giver afkastet $\text{pos}_t \cdot (p_{t+1}/p_t - 1)$ på dag $t+1$. Der bruges altså kun information, man havde på dag $t$ (ingen look-ahead).

**Input:** Første linje er $n$, $s$ og $l$. Anden linje er $n$ kurser (hele tal).

**Output:** Tre linjer:
1. strategiens samlede afkast $\prod (1 + \text{dagsafkast}) - 1$ fra dag $l$ til dag $n$, med 4 decimaler,
2. købe-og-hold-afkastet over samme periode, $p_n/p_l - 1$, med 4 decimaler,
3. antallet af handler: hvor mange gange positionen skifter (før dag $l$ er positionen 0).

**Grænser:** $1 \le s < l < n \le 2 \cdot 10^5$, $1 \le p_t \le 10^6$.
