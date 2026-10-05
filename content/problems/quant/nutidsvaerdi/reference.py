# Referenceløsning til quant/nutidsvaerdi (kun hos dommeren)
r = float(input())
cs = [float(x) for x in input().split()]
npv = sum(c / (1 + r) ** t for t, c in enumerate(cs))
print(f"{npv:.2f}")
