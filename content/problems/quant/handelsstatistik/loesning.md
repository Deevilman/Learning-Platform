Hit rate alene siger ikke, om en strategi tjener penge: en strategi med hit rate 30 % kan være fremragende, hvis gevinsterne er meget større end tabene. Profit factor samler begge dele; over 1 betyder, at strategien tjener penge før omkostninger. Én gennemgang: $O(n)$.

```python
import sys

data = sys.stdin.read().split()
n = int(data[0])
gs = [float(v) for v in data[1:n + 1]]
wins = [g for g in gs if g > 0]
losses = [-g for g in gs if g < 0]
print(f"{len(wins) / n:.4f}")
print(f"{(sum(wins) / len(wins) if wins else 0.0):.2f}")
print(f"{(sum(losses) / len(losses) if losses else 0.0):.2f}")
print(f"{sum(wins) / sum(losses):.4f}" if losses else "uendelig")
```
