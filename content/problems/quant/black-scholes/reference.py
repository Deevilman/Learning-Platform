# Referenceløsning til quant/black-scholes (kun hos dommeren)
import math

S, K, r, sigma, T = map(float, input().split())


def Phi(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


d1 = (math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * math.sqrt(T))
d2 = d1 - sigma * math.sqrt(T)
disc = K * math.exp(-r * T)
print(f"{S * Phi(d1) - disc * Phi(d2):.4f}")
print(f"{disc * Phi(-d2) - S * Phi(-d1):.4f}")
