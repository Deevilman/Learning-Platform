VWAP vægter hver handel med dens størrelse, så store handler betyder mere end små. Det er et naturligt benchmark for en ordre, der eksekveres over en dag: har du købt under VWAP, har du gjort det godt. Én gennemgang: $O(n)$.

```python
import sys

data = sys.stdin.read().split()
n = int(data[0])
value, volume = 0.0, 0
for i in range(n):
    p, q = float(data[1 + 2 * i]), int(data[2 + 2 * i])
    value += p * q
    volume += q
print(f"{value / volume:.4f}")
print(volume)
```
