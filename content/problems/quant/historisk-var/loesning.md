Historisk VaR bruger de faktiske afkast uden at antage en fordeling. VaR siger, hvor slemt det kan gå på en "almindelig dårlig dag", men intet om, hvor slemt det bliver ud over grænsen. Det gør Expected Shortfall, som er gennemsnittet af halen; derfor foretrækker tilsyn ES. Sorteringen koster $O(n \log n)$. Bemærk at $\lceil (100-a)n/100 \rceil$ beregnet med kommatal kan blive én for stor; hele tal er sikre.

```python
import sys

data = sys.stdin.read().split()
n, a = int(data[0]), int(data[1])
rs = sorted(float(v) for v in data[2:2 + n])
k = max(1, ((100 - a) * n + 99) // 100)
print(f"{-rs[k - 1]:.4f}")
print(f"{-sum(rs[:k]) / k:.4f}")
```
