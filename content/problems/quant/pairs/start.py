import math
import sys

data = sys.stdin.read().split()
n, k, beta, e = int(data[0]), int(data[1]), float(data[2]), float(data[3])
A = [float(v) for v in data[4:4 + n]]
B = [float(v) for v in data[4 + n:4 + 2 * n]]
