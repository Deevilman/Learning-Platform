import math
import sys

data = sys.stdin.read().split()
n = int(data[0])
names = data[1:2 * n + 1:2]
xs = [float(v) for v in data[2:2 * n + 2:2]]
