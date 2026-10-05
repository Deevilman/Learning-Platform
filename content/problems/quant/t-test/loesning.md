Gennemsnittet af $n$ afkast har standardafvigelsen $s/\sqrt{n}$ (standardfejlen), så $t$ måler, hvor mange standardfejl gennemsnittet ligger fra 0. Er det sande gennemsnit 0, er $t$ omtrent standardnormalfordelt, og $|t| > 1.96$ sker kun med 5 % sandsynlighed. Bemærk, at et års daglige afkast sjældent er nok til at vise en lille fordel.

```python
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
rs = [float(v) for v in data[1:n + 1]]
mu = sum(rs) / n
s = math.sqrt(sum((x - mu) ** 2 for x in rs) / (n - 1))
t = mu / (s / math.sqrt(n))
print(f"{t:.4f}")
print("signifikant" if abs(t) > 1.96 else "ikke signifikant")
```
