# Referenceløsning til quant/t-test (kun hos dommeren)
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
rs = [float(v) for v in data[1:n + 1]]
mu = sum(rs) / n
s = math.sqrt(sum((x - mu) ** 2 for x in rs) / (n - 1))
t = mu / (s / math.sqrt(n))
print(f"{t:.4f}")
print("signifikant" if abs(t) > 1.96 else "ikke signifikant")
