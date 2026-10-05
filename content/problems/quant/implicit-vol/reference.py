# Referenceløsning til quant/implicit-vol (kun hos dommeren)
import math

C, S, K, r, T = map(float, input().split())


def Phi(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def call(sigma):
    d1 = (math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * math.sqrt(T))
    return S * Phi(d1) - K * math.exp(-r * T) * Phi(d1 - sigma * math.sqrt(T))


lo, hi = 0.01, 3.0
for _ in range(100):
    mid = (lo + hi) / 2
    if call(mid) < C:
        lo = mid
    else:
        hi = mid
print(f"{(lo + hi) / 2:.4f}")
