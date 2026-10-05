Variansen af aktiens afkast deler sig i to: $\beta^2\mathrm{Var}(m)$, som er markedsrisiko og ikke kan diversificeres væk, og $\mathrm{Var}(\varepsilon)$, den idiosynkratiske risiko, som forsvinder i en bred portefølje. Man deler med $n-2$, fordi residualerne har mistet to frihedsgrader ved estimationen af $\alpha$ og $\beta$. Tre gennemgange: $O(n)$.

```python
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
rs = [float(v) for v in data[1:n + 1]]
ms = [float(v) for v in data[n + 1:2 * n + 1]]
mr, mm = sum(rs) / n, sum(ms) / n
beta = sum((m - mm) * (x - mr) for x, m in zip(rs, ms)) / sum((m - mm) ** 2 for m in ms)
alpha = mr - beta * mm
sse = sum((x - alpha - beta * m) ** 2 for x, m in zip(rs, ms))
print(f"{beta:.4f}")
print(f"{math.sqrt(sse / (n - 2)):.4f}")
```
