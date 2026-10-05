Value at Risk (VaR) på niveau $a$ % svarer på: hvor meget kan vi tabe på en dag, som kun overskrides på $(100 - a)$ % af dagene? Med historiske afkast $r_1, \dots, r_n$:

1. Sortér afkastene stigende: $r_{(1)} \le r_{(2)} \le \dots \le r_{(n)}$.
2. Sæt $k = \lceil (100 - a) \cdot n / 100 \rceil$ (mindst 1). Regn det med hele tal, fx `((100 - a) * n + 99) // 100`.
3. $VaR = -r_{(k)}$, og Expected Shortfall er gennemsnittet af de $k$ værste tab: $ES = -\frac1k\sum_{i=1}^{k} r_{(i)}$.

**Input:** Første linje er $n$ og $a$ (et helt tal, fx 95 eller 99). Anden linje er de $n$ afkast.

**Output:** To linjer: VaR og ES, begge med 4 decimaler.

**Grænser:** $1 \le n \le 10^5$, $50 \le a \le 99$.
