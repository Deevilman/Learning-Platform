# Referenceløsning til quant/sharpe (kun hos dommeren)
import math
import sys

data = sys.stdin.read().split()
n, rf = int(data[0]), float(data[1])
xs = [float(v) - rf for v in data[2:n + 2]]
mu = sum(xs) / n
s = math.sqrt(sum((x - mu) ** 2 for x in xs) / (n - 1))
print(f"{mu / s * math.sqrt(252):.4f}")
