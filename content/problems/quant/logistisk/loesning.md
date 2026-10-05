Logistisk regression er en lineær model for log-odds: $\ln\frac{p}{1-p} = w_0 + w^T x$. Sigmoid-funktionen presser resultatet ind mellem 0 og 1. Træfsikkerheden skal altid måles på data, modellen ikke er trænet på; i finans er en træfsikkerhed på 52–55 % ofte meget, mens 70 % på nye data næsten altid betyder en fejl i backtesten. Det koster $O(nd)$.

```python
import math
import sys

data = sys.stdin.read().split()
d, n = int(data[0]), int(data[1])
w = [float(v) for v in data[2:3 + d]]
out, hits = [], 0
for i in range(n):
    row = data[3 + d + i * (d + 1):3 + d + (i + 1) * (d + 1)]
    z = w[0] + sum(wj * float(x) for wj, x in zip(w[1:], row[:d]))
    p = 1 / (1 + math.exp(-z))
    hits += (p >= 0.5) == (row[d] == "1")
    out.append(f"{p:.4f}")
out.append(f"{hits / n:.4f}")
print("\n".join(out))
```
