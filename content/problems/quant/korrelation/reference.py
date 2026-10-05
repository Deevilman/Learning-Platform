# Referenceløsning til quant/korrelation (kun hos dommeren)
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
xs = [float(v) for v in data[1:n + 1]]
ys = [float(v) for v in data[n + 1:2 * n + 1]]
mx, my = sum(xs) / n, sum(ys) / n
sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
sxx = sum((x - mx) ** 2 for x in xs)
syy = sum((y - my) ** 2 for y in ys)
print(f"{sxy / math.sqrt(sxx * syy):.4f}")
