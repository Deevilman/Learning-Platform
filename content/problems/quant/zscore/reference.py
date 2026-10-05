# Referenceløsning til quant/zscore (kun hos dommeren)
import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
names = data[1:2 * n + 1:2]
xs = [float(v) for v in data[2:2 * n + 2:2]]
mu = sum(xs) / n
sd = math.sqrt(sum((x - mu) ** 2 for x in xs) / n)
zs = [(x - mu) / sd for x in xs]
out = [f"{name} {z:.4f}" for name, z in zip(names, zs)]
out.append(f"lang: {names[zs.index(max(zs))]}")
out.append(f"kort: {names[zs.index(min(zs))]}")
print("\n".join(out))
