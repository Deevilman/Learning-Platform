import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
xs = [float(v) for v in data[1:n + 1]]
ys = [float(v) for v in data[n + 1:2 * n + 1]]
