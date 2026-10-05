Toppen indtil dag $t$ er $\max(p_1, \dots, p_t)$, og den kan opdateres med ét skridt ad gangen: ny top = max(gammel top, $p_t$). Så kan faldet fra toppen regnes ud for hver dag, mens man går frem, og det største gemmes. Det er én gennemgang, $O(n)$ tid og $O(1)$ ekstra hukommelse.

```python
import sys

data = sys.stdin.read().split()
n = int(data[0])
peak = 0.0
mdd = 0.0
for x in data[1:n + 1]:
    p = float(x)
    if p > peak:
        peak = p
    dd = (peak - p) / peak
    if dd > mdd:
        mdd = dd
print(f"{mdd:.4f}")
```
