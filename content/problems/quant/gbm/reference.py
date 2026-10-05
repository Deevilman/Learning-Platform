# Referenceløsning til quant/gbm (kun hos dommeren)
import math

S0, mu, sigma, T = map(float, input().split())
drift = (mu - sigma * sigma / 2) * T
prob_up = 0.5 * (1 + math.erf(drift / (sigma * math.sqrt(T)) / math.sqrt(2)))
print(f"{S0 * math.exp(mu * T):.4f}")
print(f"{S0 * math.exp(drift):.4f}")
print(f"{prob_up:.4f}")
