import sys

data = sys.stdin.read().split()
n, L = int(data[0]), int(data[1])
xs = [float(v) for v in data[2:2 + n]]
