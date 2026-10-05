# Referenceløsning til quant/ewma (kun hos dommeren)
import math
import sys

data = sys.stdin.read().split()
n, lam = int(data[0]), float(data[1])
rs = [float(v) for v in data[2:2 + n]]
var = rs[0] ** 2
for x in rs[1:]:
    var = lam * var + (1 - lam) * x * x
s = math.sqrt(var)
print(f"{s:.6f}")
print(f"{s * math.sqrt(252):.4f}")
