Et binomialtræ deler tiden $T$ op i $N$ skridt af længden $\Delta t = T/N$. I hvert skridt går aktien op med faktoren $u = e^{\sigma\sqrt{\Delta t}}$ eller ned med $d = 1/u$. Den risikoneutrale sandsynlighed for op er $q = \dfrac{e^{r\Delta t} - d}{u - d}$.

Optionens værdi findes baglæns: ved udløb er den udbetalingen ($\max(S - K, 0)$ for en call, $\max(K - S, 0)$ for en put). I hver knude før er værdien den diskonterede forventning $e^{-r\Delta t}\left(q\,V_{\text{op}} + (1-q)\,V_{\text{ned}}\right)$. En **amerikansk** option kan indfries når som helst, så dens værdi i en knude er den største af den værdi og udbetalingen ved at indfri nu.

**Input:** Én linje med $S$, $K$, $r$, $\sigma$, $T$, $N$, typen (`call` eller `put`) og stilen (`europæisk` eller `amerikansk`).

**Output:** Optionens pris med 4 decimaler.

**Grænser:** $0 < S, K \le 10^4$, $0 \le r \le 0.2$, $0.05 \le \sigma \le 1$, $0 < T \le 5$, $1 \le N \le 500$.
