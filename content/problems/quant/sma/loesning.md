Vinduet flytter sig én dag ad gangen, så den ny sum er den gamle plus $p_t$ minus $p_{t-k}$. Det er et **glidende vindue**: $O(1)$ arbejde pr. dag og $O(n)$ i alt, uanset hvor stor $k$ er. Fordi kurserne er hele tal, er summerne helt præcise.

```python
import sys

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
p = [int(v) for v in data[2:2 + n]]
s = sum(p[:k])
out = [s / k]
for t in range(k, n):
    s += p[t] - p[t - k]
    out.append(s / k)
print("\n".join(f"{v:.4f}" for v in out))
```
