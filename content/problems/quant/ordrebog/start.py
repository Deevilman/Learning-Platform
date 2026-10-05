import heapq
import sys

data = sys.stdin.read().split()
n = int(data[0])
# ordre t: data[1 + 3*t] er BUY/SELL, data[2 + 3*t] prisen, data[3 + 3*t] antallet
