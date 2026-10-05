Det vigtigste i en backtest er at undgå **look-ahead**: beslutningen på dag $t$ må kun bruge data til og med dag $t$, og den giver først afkast fra $t$ til $t+1$. Begge gennemsnit opdateres som glidende summer, så backtesten er $O(n)$. Sammenligning med krydsmultiplikation undgår afrundingsfejl ved lighed. Prøv at sammenligne strategien med købe-og-hold: trendstrategier taber ofte i sidelæns markeder, fordi de handler for meget.

```python
import sys

data = sys.stdin.read().split()
n, s, l = int(data[0]), int(data[1]), int(data[2])
p = [int(v) for v in data[3:3 + n]]
ss, sl = sum(p[l - s:l]), sum(p[:l])
growth, pos, trades = 1.0, 0, 0
for t in range(l - 1, n - 1):
    if t > l - 1:
        ss += p[t] - p[t - s]
        sl += p[t] - p[t - l]
    new = 1 if ss * l > sl * s else 0
    if new != pos:
        trades += 1
        pos = new
    if pos:
        growth *= p[t + 1] / p[t]
print(f"{growth - 1:.4f}")
print(f"{p[n - 1] / p[l - 1] - 1:.4f}")
print(trades)
```
