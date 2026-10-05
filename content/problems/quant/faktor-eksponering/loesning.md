Eksponeringen er lineær i vægtene, så porteføljens beta over for en faktor er det vægtede gennemsnit af aktiernes betaer. En "markedsneutral" portefølje har $B_{\text{marked}} = 0$. Beregningen er $O(nk)$.

```python
import sys

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
w = [float(v) for v in data[2:2 + n]]
B = [0.0] * k
for i in range(n):
    row = data[2 + n + i * k:2 + n + (i + 1) * k]
    for j in range(k):
        B[j] += w[i] * float(row[j])
print(" ".join(f"{b:.4f}" for b in B))
```
