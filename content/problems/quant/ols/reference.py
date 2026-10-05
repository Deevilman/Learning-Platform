# Referenceløsning til quant/ols (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n = int(data[0])
xs = [float(v) for v in data[1:n + 1]]
ys = [float(v) for v in data[n + 1:2 * n + 1]]
mx, my = sum(xs) / n, sum(ys) / n
sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
sxx = sum((x - mx) ** 2 for x in xs)
beta = sxy / sxx
alpha = my - beta * mx
ssr = sum((y - alpha - beta * x) ** 2 for x, y in zip(xs, ys))
sst = sum((y - my) ** 2 for y in ys)
print(f"{beta:.4f}")
print(f"{alpha:.4f}")
print(f"{1 - ssr / sst:.4f}")
