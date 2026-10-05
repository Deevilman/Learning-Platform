Afkastet er lineært i vægtene, så middelværdien er den vægtede sum. Variansen af en sum indeholder alle kovarianserne: $\mathrm{Var}(\sum w_i R_i) = \sum_i\sum_j w_i w_j \mathrm{Cov}(R_i, R_j)$. Det er her, diversificering kommer fra: når korrelationerne er lave, bliver porteføljens volatilitet mindre end det vægtede gennemsnit af volatiliteterne. Dobbeltsummen koster $O(n^2)$.

```python
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
w = [float(v) for v in data[1:n + 1]]
mu = [float(v) for v in data[n + 1:2 * n + 1]]
S = [[float(v) for v in data[2 * n + 1 + i * n:2 * n + 1 + (i + 1) * n]] for i in range(n)]
mp = sum(a * b for a, b in zip(w, mu))
var = sum(w[i] * w[j] * S[i][j] for i in range(n) for j in range(n))
print(f"{mp:.6f}")
print(f"{math.sqrt(var):.6f}")
```
