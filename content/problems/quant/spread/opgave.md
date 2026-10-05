Market makere stiller et bud (bid) og et udbud (ask). Midtprisen er $(bid + ask)/2$, og det relative spread i basispoint (1 bp = 0.01 %) er
$$\text{spread} = \frac{ask - bid}{\text{midtpris}} \cdot 10000.$$

**Input:** Første linje er $n$. Så følger $n$ linjer med bid og ask.

**Output:** $n$ linjer med midtpris (4 decimaler) og spread i basispoint (2 decimaler), og til sidst en linje med det gennemsnitlige spread i basispoint (2 decimaler).

**Grænser:** $1 \le n \le 10^5$, $0 < bid < ask \le 10^5$.
