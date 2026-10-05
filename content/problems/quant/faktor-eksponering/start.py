import sys

data = sys.stdin.read().split()
n, k = int(data[0]), int(data[1])
w = [float(v) for v in data[2:2 + n]]
