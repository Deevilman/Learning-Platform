# Referenceløsning til quant/afkast (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n = int(data[0])
p = [float(x) for x in data[1:n + 1]]
print("\n".join(f"{b / a - 1:.6f}" for a, b in zip(p, p[1:])))
