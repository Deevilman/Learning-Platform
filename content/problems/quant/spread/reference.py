# Referenceløsning til quant/spread (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n = int(data[0])
out, total = [], 0.0
for i in range(n):
    bid, ask = float(data[1 + 2 * i]), float(data[2 + 2 * i])
    mid = (bid + ask) / 2
    bp = (ask - bid) / mid * 10000
    total += bp
    out.append(f"{mid:.4f} {bp:.2f}")
out.append(f"{total / n:.2f}")
print("\n".join(out))
