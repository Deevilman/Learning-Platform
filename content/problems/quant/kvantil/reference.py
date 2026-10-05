# Referenceløsning til quant/kvantil (kun hos dommeren)
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
xs = sorted(float(v) for v in data[1:n + 1])
m = int(data[n + 1])
out = []
for q in data[n + 2:n + 2 + m]:
    h = (n - 1) * float(q)
    j = math.floor(h)
    if j >= n - 1:
        out.append(xs[n - 1])
    else:
        out.append(xs[j] + (h - j) * (xs[j + 1] - xs[j]))
print("\n".join(f"{v:.4f}" for v in out))
