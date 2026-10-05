$\binom{n}{k}$ tæller, hvor mange måder de $k$ vindende dage kan placeres på, og hver placering har sandsynligheden $p^k(1-p)^{n-k}$. Fordelingsfunktionen er summen af de første $k+1$ punktsandsynligheder, så det er $O(n)$ led. I C skal man passe på, at $\binom{n}{k}$ kan blive meget stor; regn den fx som et produkt af brøker eller med `lgamma`.

```python
import math

n, k, p = input().split()
n, k, p = int(n), int(k), float(p)


def pmf(j):
    return math.comb(n, j) * p ** j * (1 - p) ** (n - j)


print(f"{pmf(k):.6f}")
print(f"{sum(pmf(j) for j in range(k + 1)):.6f}")
```
