En strategi vinder på en dag med sandsynlighed $p$, uafhængigt af de andre dage. Antallet $X$ af vindende dage ud af $n$ er binomialfordelt:
$$P(X = k) = \binom{n}{k} p^k (1-p)^{n-k}.$$

**Input:** Én linje med $n$, $k$ og $p$.

**Output:** To linjer: $P(X = k)$ og $P(X \le k)$, begge med 6 decimaler.

**Grænser:** $1 \le n \le 1000$, $0 \le k \le n$, $0 \le p \le 1$.
