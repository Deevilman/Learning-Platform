Både gennemsnit og varians skaleres lineært med tiden, så gennemsnittet bliver $252\bar x$ om året og standardafvigelsen $\sqrt{252}\,s_x$. Forholdet bliver derfor $\sqrt{252}\,\bar x/s_x$. Én gennemgang til gennemsnittet og én til variansen: $O(n)$.

```python
import math
import sys

data = sys.stdin.read().split()
n, rf = int(data[0]), float(data[1])
xs = [float(v) - rf for v in data[2:n + 2]]
mu = sum(xs) / n
s = math.sqrt(sum((x - mu) ** 2 for x in xs) / (n - 1))
print(f"{mu / s * math.sqrt(252):.4f}")
```
