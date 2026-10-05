Træet er "rekombinerende": op-ned og ned-op ender samme sted, så der er kun $k+1$ knuder efter $k$ skridt. Baglæns induktion koster derfor $O(N^2)$ i stedet for $O(2^N)$. For europæiske optioner nærmer prisen sig Black–Scholes-prisen, når $N$ vokser. En amerikansk call på en aktie uden udbytte er aldrig værd mere end den europæiske, men en amerikansk put kan være det, fordi det kan betale sig at indfri tidligt.

```python
import math

parts = input().split()
S, K, r, sigma, T = map(float, parts[:5])
N, kind, style = int(parts[5]), parts[6], parts[7]
dt = T / N
u = math.exp(sigma * math.sqrt(dt))
d = 1 / u
q = (math.exp(r * dt) - d) / (u - d)
disc = math.exp(-r * dt)


def payoff(price):
    return max(price - K, 0.0) if kind == "call" else max(K - price, 0.0)


V = [payoff(S * u ** j * d ** (N - j)) for j in range(N + 1)]
for step in range(N - 1, -1, -1):
    for j in range(step + 1):
        V[j] = disc * (q * V[j + 1] + (1 - q) * V[j])
        if style == "amerikansk":
            V[j] = max(V[j], payoff(S * u ** j * d ** (step - j)))
print(f"{V[0]:.4f}")
```
