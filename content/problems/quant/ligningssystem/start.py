import sys

data = sys.stdin.read().split()
n = int(data[0])
vals = [float(v) for v in data[1:1 + n * (n + 1)]]
M = [vals[i * (n + 1):(i + 1) * (n + 1)] for i in range(n)]  # rækkerne i [A | b]
