# Referenceløsning til quant/capm (kun hos dommeren)
import sys

data = sys.stdin.read().split()
rf, rm = float(data[0]), float(data[1])
n = int(data[2])
rows = []
for i in range(n):
    name, beta, ret = data[3 + 3 * i], float(data[4 + 3 * i]), float(data[5 + 3 * i])
    er = rf + beta * (rm - rf)
    rows.append((round(ret - er, 10), name, er, ret - er))
rows.sort(key=lambda t: (-t[0], t[1]))
print("\n".join(f"{name} {er:.4f} {alpha:.4f}" for _, name, er, alpha in rows))
