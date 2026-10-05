# Referenceløsning til quant/parametrisk-var (kun hos dommeren)
import math

V, mu, sigma, h, z = map(float, input().split())
print(f"{V * (z * sigma * math.sqrt(h) - mu * h):.2f}")
