# Referenceløsning til quant/annuitet (kun hos dommeren)
H, r, n = input().split()
H, r, n = float(H), float(r), int(n)
m = 12 * n
if r == 0:
    y = H / m
else:
    i = r / 12
    y = H * i / (1 - (1 + i) ** (-m))
print(f"{y:.2f}")
print(f"{y * m - H:.2f}")
