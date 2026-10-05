Hvert afkast bruger kun to nabokurser, så én gennemgang af listen er nok: $O(n)$. Ved store input er det udskrivningen, der tager tid, så byg hele outputtet først og skriv det på én gang.

```python
import sys

data = sys.stdin.read().split()
n = int(data[0])
p = [float(x) for x in data[1:n + 1]]
print("\n".join(f"{b / a - 1:.6f}" for a, b in zip(p, p[1:])))
```
