Hvert år ganges beløbet med $(1+r)$, så efter $n$ år er det
$$FV = P(1+r)^n.$$
Det er én beregning, så tiden er konstant.

```python
P, r, n = input().split()
P, r, n = float(P), float(r), int(n)
print(f"{P * (1 + r) ** n:.2f}")
```
