En europæisk call-option giver retten til at købe aktien til strike $K$ på tidspunktet $T$. Black–Scholes-prisen er
$$C = S\,\Phi(d_1) - K e^{-rT}\Phi(d_2), \qquad P = K e^{-rT}\Phi(-d_2) - S\,\Phi(-d_1),$$
$$d_1 = \frac{\ln(S/K) + (r + \sigma^2/2)T}{\sigma\sqrt T}, \qquad d_2 = d_1 - \sigma\sqrt T,$$
hvor $\Phi(x) = \tfrac12\left(1 + \operatorname{erf}(x/\sqrt2)\right)$, og $P$ er prisen på en put-option med samme strike.

**Input:** Én linje med $S$, $K$, $r$, $\sigma$ og $T$.

**Output:** To linjer: call-prisen og put-prisen, begge med 4 decimaler.

**Grænser:** $0 < S, K \le 10^4$, $0 \le r \le 0.2$, $0 < \sigma \le 2$, $0 < T \le 10$.
