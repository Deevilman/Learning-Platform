$\ln S_T$ er normalfordelt med middelværdi $\ln S_0 + (\mu - \sigma^2/2)T$ og varians $\sigma^2 T$. Medianen af $S_T$ er derfor $e$ opløftet i middelværdien, mens $E[S_T]$ er større, fordi $E[e^X] = e^{E[X] + \mathrm{Var}(X)/2}$. Forskellen er vigtig: med høj volatilitet kan den forventede værdi vokse, mens den typiske aktie (medianen) falder.

```python
import math

S0, mu, sigma, T = map(float, input().split())
drift = (mu - sigma * sigma / 2) * T
prob_up = 0.5 * (1 + math.erf(drift / (sigma * math.sqrt(T)) / math.sqrt(2)))
print(f"{S0 * math.exp(mu * T):.4f}")
print(f"{S0 * math.exp(drift):.4f}")
print(f"{prob_up:.4f}")
```
