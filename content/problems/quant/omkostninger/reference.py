# Referenceløsning til quant/omkostninger (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n, c = int(data[0]), float(data[1])
gross, net, turnover, prev = 1.0, 1.0, 0.0, 0.0
for i in range(n):
    w, ret = float(data[2 + 2 * i]), float(data[3 + 2 * i])
    trade = abs(w - prev)
    gross *= 1 + w * ret
    net *= 1 + w * ret - c * trade
    turnover += trade
    prev = w
print(f"{gross - 1:.6f}")
print(f"{net - 1:.6f}")
print(f"{turnover:.4f}")
