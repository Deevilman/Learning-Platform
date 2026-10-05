# Referenceløsning til quant/drawdown (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n = int(data[0])
peak = 0.0
mdd = 0.0
for x in data[1:n + 1]:
    p = float(x)
    if p > peak:
        peak = p
    dd = (peak - p) / peak
    if dd > mdd:
        mdd = dd
print(f"{mdd:.4f}")
