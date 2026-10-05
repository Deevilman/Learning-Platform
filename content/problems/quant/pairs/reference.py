# Referenceløsning til quant/pairs (kun hos dommeren)
import math
import sys

data = sys.stdin.read().split()
n, k, beta, e = int(data[0]), int(data[1]), float(data[2]), float(data[3])
A = [float(v) for v in data[4:4 + n]]
B = [float(v) for v in data[4 + n:4 + 2 * n]]
s = [a - beta * b for a, b in zip(A[n - k:], B[n - k:])]
m = sum(s) / k
sd = math.sqrt(sum((x - m) ** 2 for x in s) / (k - 1))
z = (s[-1] - m) / sd
print(f"{z:.4f}")
print("sælg spread" if z > e else "køb spread" if z < -e else "vent")
