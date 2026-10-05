Med andelen $f$ ganges formuen med $1 + fb$ ved gevinst og $1 - f$ ved tab. Den forventede log-vækst er $g(f) = p\ln(1+fb) + (1-p)\ln(1-f)$. Sæt $g'(f) = 0$:
$$\frac{pb}{1+fb} = \frac{1-p}{1-f} \iff f = p - \frac{1-p}{b}.$$
Satser du mere end $f^*$, falder væksten igen, og ved cirka $2f^*$ bliver den negativ, selv om spillet er fordelagtigt.

```python
import math

p, b = map(float, input().split())
f = max(0.0, p - (1 - p) / b)
g = p * math.log(1 + f * b) + (1 - p) * math.log(1 - f)
print(f"{f:.4f}")
print(f"{g:.6f}")
```
