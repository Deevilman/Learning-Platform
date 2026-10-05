# Referenceløsning til quant/kelly (kun hos dommeren)
import math

p, b = map(float, input().split())
f = max(0.0, p - (1 - p) / b)
g = p * math.log(1 + f * b) + (1 - p) * math.log(1 - f)
print(f"{f:.4f}")
print(f"{g:.6f}")
