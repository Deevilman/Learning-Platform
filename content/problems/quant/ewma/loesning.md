EWMA er et vægtet gennemsnit af de kvadrerede afkast, hvor vægten på et afkast for $j$ dage siden er proportional med $\lambda^j$. Med $\lambda = 0.94$ (RiskMetrics) har en dag for 11 dage siden halvt så meget vægt som i dag. Estimatet reagerer derfor hurtigt, når markedet bliver uroligt. Opdateringen er $O(1)$ pr. dag.

```python
import math
import sys

data = sys.stdin.read().split()
n, lam = int(data[0]), float(data[1])
rs = [float(v) for v in data[2:2 + n]]
var = rs[0] ** 2
for x in rs[1:]:
    var = lam * var + (1 - lam) * x * x
s = math.sqrt(var)
print(f"{s:.6f}")
print(f"{s * math.sqrt(252):.4f}")
```
