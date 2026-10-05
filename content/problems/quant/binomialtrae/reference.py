# Referenceløsning til quant/binomialtrae (kun hos dommeren)
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
