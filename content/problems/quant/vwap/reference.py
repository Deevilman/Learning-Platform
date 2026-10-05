# Referenceløsning til quant/vwap (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n = int(data[0])
value, volume = 0.0, 0
for i in range(n):
    p, q = float(data[1 + 2 * i]), int(data[2 + 2 * i])
    value += p * q
    volume += q
print(f"{value / volume:.4f}")
print(volume)
