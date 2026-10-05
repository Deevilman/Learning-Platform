Gauss-elimination omformer systemet til en øvre trekantsmatrix uden at ændre løsningen, fordi man kun bytter rækker og lægger multipla af rækker til andre rækker. Delvis pivotering sikrer, at man aldrig deler med 0, når systemet har en entydig løsning, og at multiplikatorerne højst er 1 i numerisk værdi, hvilket holder afrundingsfejlene små. Eliminationen koster $O(n^3)$ og baglæns substitution $O(n^2)$.

```python
import sys

data = sys.stdin.read().split()
n = int(data[0])
vals = [float(v) for v in data[1:1 + n * (n + 1)]]
M = [vals[i * (n + 1):(i + 1) * (n + 1)] for i in range(n)]
for c in range(n):
    p = max(range(c, n), key=lambda i: abs(M[i][c]))
    M[c], M[p] = M[p], M[c]
    for i in range(c + 1, n):
        f = M[i][c] / M[c][c]
        for j in range(c, n + 1):
            M[i][j] -= f * M[c][j]
x = [0.0] * n
for i in range(n - 1, -1, -1):
    s = M[i][n] - sum(M[i][j] * x[j] for j in range(i + 1, n))
    x[i] = s / M[i][i]
print("\n".join(f"{v:.4f}" for v in x))
```
