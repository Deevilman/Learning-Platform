# Referenceløsning til quant/fremtidsvaerdi (kun hos dommeren)
P, r, n = input().split()
P, r, n = float(P), float(r), int(n)
print(f"{P * (1 + r) ** n:.2f}")
