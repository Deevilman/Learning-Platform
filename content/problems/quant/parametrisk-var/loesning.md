Under antagelsen om uafhængige, normalfordelte dagsafkast vokser middelværdien lineært og standardafvigelsen med kvadratroden af tiden ("kvadratrods-reglen"). VaR er så positionen gange afstanden fra middelværdien ned til kvantilen. Metoden er hurtig, men undervurderer risikoen, når fordelingen har tykke haler, som finansielle afkast ofte har.

```python
import math

V, mu, sigma, h, z = map(float, input().split())
print(f"{V * (z * sigma * math.sqrt(h) - mu * h):.2f}")
```
