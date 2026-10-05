# Referenceløsning til quant/log-afkast (kun hos dommeren)
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
rs = [float(x) for x in data[1:n + 1]]
total = 1.0
for x in rs:
    total *= 1 + x
print(f"{total - 1:.6f}")
print(f"{sum(math.log1p(x) for x in rs):.6f}")
