# Referenceløsning til quant/momentum (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
rows = []
for i in range(n):
    name, before, now = data[2 + 3 * i], float(data[3 + 3 * i]), float(data[4 + 3 * i])
    ret = now / before - 1
    rows.append((-round(ret, 10), name, ret))
rows.sort()
print("\n".join(f"{name} {ret:.4f}" for _, name, ret in rows[:k]))
