# Referenceløsning til quant/faktor-eksponering (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
w = [float(v) for v in data[2:2 + n]]
B = [0.0] * k
for i in range(n):
    row = data[2 + n + i * k:2 + n + (i + 1) * k]
    for j in range(k):
        B[j] += w[i] * float(row[j])
print(" ".join(f"{b:.4f}" for b in B))
