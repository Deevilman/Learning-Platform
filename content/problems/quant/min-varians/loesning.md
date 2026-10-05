$\sigma_P^2(w)$ er et andengradspolynomium i $w$ med positiv koefficient på $w^2$, så minimum findes, hvor den afledte er 0:
$$2w\sigma_1^2 - 2(1-w)\sigma_2^2 + 2(1-2w)\rho\sigma_1\sigma_2 = 0.$$
Løs for $w$, så får du $w^*$. Er korrelationen høj, og har aktiv 2 større risiko, kan $w^*$ blive større end 1: man sælger det risikable aktiv short for at sikre det andet.

```python
import math

s1, s2, rho = map(float, input().split())
w = (s2 * s2 - rho * s1 * s2) / (s1 * s1 + s2 * s2 - 2 * rho * s1 * s2)
var = w * w * s1 * s1 + (1 - w) ** 2 * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2
print(f"{w:.4f}")
print(f"{math.sqrt(max(var, 0.0)):.4f}")
```
