# Referenceløsning til quant/min-varians (kun hos dommeren)
import math

s1, s2, rho = map(float, input().split())
w = (s2 * s2 - rho * s1 * s2) / (s1 * s1 + s2 * s2 - 2 * rho * s1 * s2)
var = w * w * s1 * s1 + (1 - w) ** 2 * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2
print(f"{w:.4f}")
print(f"{math.sqrt(max(var, 0.0)):.4f}")
