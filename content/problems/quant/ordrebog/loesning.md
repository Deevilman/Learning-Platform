Pris-tid-prioritet betyder: bedste pris først, og ved samme pris den, der kom først. En heap giver den bedste hvilende ordre i $O(1)$ og fjerner den i $O(\log n)$. Hver ordre bliver højst lagt i bogen én gang og fjernet én gang, og hver handel enten fjerner en hvilende ordre eller opbruger den nye. Derfor er det samlede arbejde $O(n \log n)$.

```python
import heapq
import sys

data = sys.stdin.read().split()
n = int(data[0])
bids, asks = [], []  # heaps: (-pris, tid, [antal]) og (pris, tid, [antal])
out = []
for t in range(n):
    side, price, qty = data[1 + 3 * t], int(data[2 + 3 * t]), int(data[3 + 3 * t])
    if side == "BUY":
        while qty and asks and asks[0][0] <= price:
            top = asks[0]
            traded = min(qty, top[2][0])
            out.append(f"{top[0]} {traded}")
            qty -= traded
            top[2][0] -= traded
            if top[2][0] == 0:
                heapq.heappop(asks)
        if qty:
            heapq.heappush(bids, (-price, t, [qty]))
    else:
        while qty and bids and -bids[0][0] >= price:
            top = bids[0]
            traded = min(qty, top[2][0])
            out.append(f"{-top[0]} {traded}")
            qty -= traded
            top[2][0] -= traded
            if top[2][0] == 0:
                heapq.heappop(bids)
        if qty:
            heapq.heappush(asks, (price, t, [qty]))
out.append(f"bedste bud: {-bids[0][0] if bids else '-'}")
out.append(f"bedste udbud: {asks[0][0] if asks else '-'}")
print("\n".join(out))
```
