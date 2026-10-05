En krone om $t$ år er $1/(1+r)^t$ kroner værd i dag, fordi du kunne have sat $1/(1+r)^t$ kroner ind til renten $r$ og fået én krone efter $t$ år. Nutidsværdien er summen af alle betalinger omregnet på den måde. Det tager tid proportional med antallet af betalinger.

```python
r = float(input())
cs = [float(x) for x in input().split()]
npv = sum(c / (1 + r) ** t for t, c in enumerate(cs))
print(f"{npv:.2f}")
```
