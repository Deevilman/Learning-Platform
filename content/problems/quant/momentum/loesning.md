Momentum er en af de mest robuste faktorer: aktier, der er steget mest det seneste år, har historisk fortsat lidt bedre end resten (ofte springer man den seneste måned over). Sorteringen koster $O(n \log n)$. Med `heapq.nsmallest` kan man nøjes med $O(n \log k)$.

```python
import sys

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
rows = []
for i in range(n):
    name, before, now = data[2 + 3 * i], float(data[3 + 3 * i]), float(data[4 + 3 * i])
    ret = now / before - 1
    rows.append((-round(ret, 10), name, ret))
rows.sort()
print("\n".join(f"{name} {ret:.4f}" for _, name, ret in rows[:k]))
```
