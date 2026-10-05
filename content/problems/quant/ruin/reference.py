# Referenceløsning til quant/ruin (kun hos dommeren)
i, N, p = input().split()
i, N, p = int(i), int(N), float(p)
if p == 0.5:
    print(f"{i / N:.6f}")
else:
    rho = (1 - p) / p
    print(f"{(1 - rho ** i) / (1 - rho ** N):.6f}")
