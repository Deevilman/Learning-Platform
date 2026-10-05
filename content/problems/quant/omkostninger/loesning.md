Omkostningen afhænger kun af, hvor meget du handler, ikke af hvad du ejer. En strategi med høj omsætning kan derfor have et flot bruttoafkast og et dårligt nettoafkast. Ved $c = 0.001$ (10 basispoint) og en daglig omsætning på 1 koster det ca. 25 % om året. Én gennemgang: $O(n)$.

```python
import sys

data = sys.stdin.read().split()
n, c = int(data[0]), float(data[1])
gross, net, turnover, prev = 1.0, 1.0, 0.0, 0.0
for i in range(n):
    w, ret = float(data[2 + 2 * i]), float(data[3 + 2 * i])
    trade = abs(w - prev)
    gross *= 1 + w * ret
    net *= 1 + w * ret - c * trade
    turnover += trade
    prev = w
print(f"{gross - 1:.6f}")
print(f"{net - 1:.6f}")
print(f"{turnover:.4f}")
```
