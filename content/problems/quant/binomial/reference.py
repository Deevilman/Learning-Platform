# Referenceløsning til quant/binomial (kun hos dommeren)
import math

n, k, p = input().split()
n, k, p = int(n), int(k), float(p)


def pmf(j):
    return math.comb(n, j) * p ** j * (1 - p) ** (n - j)


print(f"{pmf(k):.6f}")
print(f"{sum(pmf(j) for j in range(k + 1)):.6f}")
