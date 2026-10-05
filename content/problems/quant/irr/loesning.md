Der er ingen formel for den interne rente, når der er mere end to betalinger, så den findes numerisk. Fordi nutidsværdien falder, når renten stiger, kan man bruge **bisektion**: start med et interval $[lo, hi]$, hvor nutidsværdien er positiv i $lo$ og negativ i $hi$. Tjek midtpunktet, og behold den halvdel, hvor fortegnet stadig skifter. Hver halvering koster én beregning af nutidsværdien, $O(n)$, og 200 halveringer giver langt mere end 4 decimalers præcision.

```python
cs = [float(x) for x in input().split()]


def npv(r):
    return sum(c / (1 + r) ** t for t, c in enumerate(cs))


lo, hi = -0.9, 10.0
for _ in range(200):
    mid = (lo + hi) / 2
    if npv(mid) > 0:
        lo = mid
    else:
        hi = mid
print(f"{(lo + hi) / 2:.4f}")
```
