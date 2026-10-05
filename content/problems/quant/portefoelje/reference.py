# Referenceløsning til quant/portefoelje (kun hos dommeren)
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
w = [float(v) for v in data[1:n + 1]]
mu = [float(v) for v in data[n + 1:2 * n + 1]]
S = [[float(v) for v in data[2 * n + 1 + i * n:2 * n + 1 + (i + 1) * n]] for i in range(n)]
mp = sum(a * b for a, b in zip(w, mu))
var = sum(w[i] * w[j] * S[i][j] for i in range(n) for j in range(n))
print(f"{mp:.6f}")
print(f"{math.sqrt(var):.6f}")
