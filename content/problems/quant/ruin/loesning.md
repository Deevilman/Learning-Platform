Lad $P_i$ være sandsynligheden for at nå målet fra $i$. Efter én handel er man i $i+1$ eller $i-1$, så $P_i = pP_{i+1} + (1-p)P_{i-1}$ med $P_0 = 0$ og $P_N = 1$. Det er en lineær differensligning, hvis løsning er formlen ovenfor. Selv en lille ulempe ($p$ lidt under $\tfrac12$) gør ruin meget sandsynlig, når målet er langt væk. Det er argumentet for at have en fordel, før man handler meget.

```python
i, N, p = input().split()
i, N, p = int(i), int(N), float(p)
if p == 0.5:
    print(f"{i / N:.6f}")
else:
    rho = (1 - p) / p
    print(f"{(1 - rho ** i) / (1 - rho ** N):.6f}")
```
