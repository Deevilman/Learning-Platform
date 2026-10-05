# Referenceløsning til quant/tilskrivninger (kun hos dommeren)
import math

P, r, m, t = input().split()
P, r, m, t = float(P), float(r), int(m), float(t)
if m == 0:
    v = P * math.exp(r * t)
else:
    v = P * (1 + r / m) ** (m * t)
print(f"{v:.2f}")
