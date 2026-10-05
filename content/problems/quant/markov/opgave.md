Markedet er hver dag enten et tyremarked (T) eller et bjørnemarked (B). Er det T i dag, er det T i morgen med sandsynlighed $a$. Er det B i dag, er det B i morgen med sandsynlighed $b$. I dag er sandsynligheden for T lig med $\pi_0$.

Find sandsynligheden for T om $k$ dage og den stationære sandsynlighed for T, altså hvor kæden ender på lang sigt:
$$\pi^* = \frac{1-b}{(1-a) + (1-b)}.$$

**Input:** Én linje med $a$, $b$, $\pi_0$ og $k$.

**Output:** To linjer: sandsynligheden for T om $k$ dage og $\pi^*$, begge med 6 decimaler.

**Grænser:** $0 \le a, b \le 1$, men ikke begge lig med 1. $0 \le \pi_0 \le 1$, og $0 \le k \le 10^{18}$ er et heltal. En løkke med $k$ skridt er alt for langsom.
