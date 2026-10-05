# Referenceløsning til quant/sma (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
p = [int(v) for v in data[2:2 + n]]
s = sum(p[:k])
out = [s / k]
for t in range(k, n):
    s += p[t] - p[t - k]
    out.append(s / k)
print("\n".join(f"{v:.4f}" for v in out))
