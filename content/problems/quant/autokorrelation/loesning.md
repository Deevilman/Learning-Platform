Nævneren er $n$ gange variansen, og tælleren er $n$ gange kovariansen mellem rækken og den forskudte række (med det fælles gennemsnit). Ved at bruge den samme nævner for alle lags bliver autokorrelationsfunktionen altid "positiv semidefinit", hvilket er den standard, statistikprogrammer bruger. Det koster $O(nL)$.

```python
import sys

data = sys.stdin.read().split()
n, L = int(data[0]), int(data[1])
xs = [float(v) for v in data[2:2 + n]]
mu = sum(xs) / n
d = [x - mu for x in xs]
den = sum(v * v for v in d)
out = []
for k in range(1, L + 1):
    out.append(sum(d[t] * d[t - k] for t in range(k, n)) / den)
print("\n".join(f"{v:.4f}" for v in out))
```
