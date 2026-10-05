Fordi $\ln(ab) = \ln a + \ln b$, bliver produktet af vækstfaktorerne til en sum af logaritmer. Det er derfor, quants ofte regner i log-afkast: de kan lægges sammen over tid, og gennemsnit og varians opfører sig pænt. Én gennemgang af listen: $O(n)$.

```python
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
rs = [float(x) for x in data[1:n + 1]]
total = 1.0
for x in rs:
    total *= 1 + x
print(f"{total - 1:.6f}")
print(f"{sum(math.log1p(x) for x in rs):.6f}")
```
