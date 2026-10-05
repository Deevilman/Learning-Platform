Variansen vokser lineært med tiden, når afkastene er uafhængige, så standardafvigelsen vokser med kvadratroden af tiden. Derfor ganges den daglige volatilitet med $\sqrt{252}$ og ikke med 252. Man deler med $n - 1$, fordi gennemsnittet er estimeret fra de samme data. To gennemgange af listen: $O(n)$.

```python
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
rs = [float(x) for x in data[1:n + 1]]
mu = sum(rs) / n
s = math.sqrt(sum((x - mu) ** 2 for x in rs) / (n - 1))
print(f"{s:.6f}")
print(f"{s * math.sqrt(252):.6f}")
```
