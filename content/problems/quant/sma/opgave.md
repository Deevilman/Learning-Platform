Det glidende gennemsnit over $k$ dage på dag $t$ er gennemsnittet af de seneste $k$ kurser:
$$SMA_t = \frac{1}{k}\sum_{s=t-k+1}^{t} p_s.$$

**Input:** Første linje er $n$ og $k$. Anden linje er $n$ kurser (hele tal, fx i øre).

**Output:** De $n - k + 1$ værdier $SMA_k, \dots, SMA_n$, én pr. linje, med 4 decimaler.

**Grænser:** $1 \le k \le n \le 2 \cdot 10^5$, $1 \le p_t \le 10^6$. Løsningen skal være $O(n)$; at lægge $k$ tal sammen for hver dag er for langsomt, når $k$ er stor.
