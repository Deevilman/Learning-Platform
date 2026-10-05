# Referenceløsning til quant/handelsstatistik (kun hos dommeren)
import sys

data = sys.stdin.read().split()
n = int(data[0])
gs = [float(v) for v in data[1:n + 1]]
wins = [g for g in gs if g > 0]
losses = [-g for g in gs if g < 0]
print(f"{len(wins) / n:.4f}")
print(f"{(sum(wins) / len(wins) if wins else 0.0):.2f}")
print(f"{(sum(losses) / len(losses) if losses else 0.0):.2f}")
print(f"{sum(wins) / sum(losses):.4f}" if losses else "uendelig")
