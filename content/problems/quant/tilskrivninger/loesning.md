Med $m$ tilskrivninger om året får du renten $r/m$ ad gangen, og det sker $mt$ gange:
$$P\left(1+\frac{r}{m}\right)^{mt}.$$
Jo flere tilskrivninger, jo mere renters rente. Grænsen for $m \to \infty$ er $P e^{rt}$, fordi $(1 + r/m)^m \to e^r$.

```python
import math

P, r, m, t = input().split()
P, r, m, t = float(P), float(r), int(m), float(t)
if m == 0:
    v = P * math.exp(r * t)
else:
    v = P * (1 + r / m) ** (m * t)
print(f"{v:.2f}")
```
