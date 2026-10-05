Middelværdien er tyngdepunktet af fordelingen, og variansen er den forventede kvadrerede afstand til tyngdepunktet. Formen $\sum p_i(x_i - \mu)^2$ er numerisk mere stabil end $E[X^2] - \mu^2$, fordi den ikke trækker to næsten lige store tal fra hinanden. To gennemgange: $O(n)$.

```python
import sys

data = sys.stdin.read().split()
n = int(data[0])
xs = [float(v) for v in data[1:2 * n + 1:2]]
ps = [float(v) for v in data[2:2 * n + 2:2]]
mu = sum(p * x for x, p in zip(xs, ps))
var = sum(p * (x - mu) ** 2 for x, p in zip(xs, ps))
print(f"{mu:.4f}")
print(f"{var:.4f}")
```
