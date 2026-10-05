Formlen kommer fra, at nutidsværdien af alle $m$ ydelser skal være lig med lånet:
$$H = \sum_{k=1}^{m} \frac{y}{(1+i)^k} = y \cdot \frac{1 - (1+i)^{-m}}{i}.$$
Løs den for $y$. Når $i = 0$, er alle ydelser lige meget værd, så $y = H/m$.

```python
H, r, n = input().split()
H, r, n = float(H), float(r), int(n)
m = 12 * n
if r == 0:
    y = H / m
else:
    i = r / 12
    y = H * i / (1 - (1 + i) ** (-m))
print(f"{y:.2f}")
print(f"{y * m - H:.2f}")
```
