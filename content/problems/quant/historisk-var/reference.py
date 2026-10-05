# Referenceløsning til quant/historisk-var (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n, a = int(data[0]), int(data[1])
rs = sorted(float(v) for v in data[2:2 + n])
k = max(1, ((100 - a) * n + 99) // 100)
print(f"{-rs[k - 1]:.4f}")
print(f"{-sum(rs[:k]) / k:.4f}")
