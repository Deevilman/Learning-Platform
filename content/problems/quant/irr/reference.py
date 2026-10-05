# Referenceløsning til quant/irr (kun hos dommeren)
cs = [float(x) for x in input().split()]


def npv(r):
    return sum(c / (1 + r) ** t for t, c in enumerate(cs))


lo, hi = -0.9, 10.0
for _ in range(200):
    mid = (lo + hi) / 2
    if npv(mid) > 0:
        lo = mid
    else:
        hi = mid
print(f"{(lo + hi) / 2:.4f}")
