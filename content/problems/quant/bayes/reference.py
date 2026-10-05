# Referenceløsning til quant/bayes (kun hos dommeren)
a, s, f = map(float, input().split())
print(f"{s * a / (s * a + f * (1 - a)):.4f}")
