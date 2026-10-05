import sys

data = sys.stdin.read().split()
n, s, l = int(data[0]), int(data[1]), int(data[2])
p = [int(v) for v in data[3:3 + n]]
