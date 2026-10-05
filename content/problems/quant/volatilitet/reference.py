# Referenceløsning til quant/volatilitet (kun hos dommeren)
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
rs = [float(x) for x in data[1:n + 1]]
mu = sum(rs) / n
s = math.sqrt(sum((x - mu) ** 2 for x in rs) / (n - 1))
print(f"{s:.6f}")
print(f"{s * math.sqrt(252):.6f}")
