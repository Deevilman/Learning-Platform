Korrelationen er kovariansen delt med produktet af standardafvigelserne. Faktoren $1/(n-1)$ går ud, så man kan bruge summerne direkte. Korrelation $\pm 1$ betyder, at punkterne ligger på en ret linje. Tre gennemgange: $O(n)$.

```python
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
xs = [float(v) for v in data[1:n + 1]]
ys = [float(v) for v in data[n + 1:2 * n + 1]]
mx, my = sum(xs) / n, sum(ys) / n
sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
sxx = sum((x - mx) ** 2 for x in xs)
syy = sum((y - my) ** 2 for y in ys)
print(f"{sxy / math.sqrt(sxx * syy):.4f}")
```
