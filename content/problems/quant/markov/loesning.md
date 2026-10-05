Fra $\pi_{k+1} = a\pi_k + (1-b)(1-\pi_k)$ får man $\pi_{k+1} - \pi^* = (a+b-1)(\pi_k - \pi^*)$, så afvigelsen fra den stationære fordeling skrumper med faktoren $\lambda = a + b - 1$ hver dag. Altså
$$\pi_k = \pi^* + \lambda^k(\pi_0 - \pi^*).$$
Potensen regnes med gentagen kvadrering: $\lambda^k = (\lambda^2)^{k/2}$, når $k$ er lige. Det giver $O(\log k)$ multiplikationer og håndterer også $\lambda = -1$ korrekt, hvor kæden skifter tilstand hver dag.

```python
a, b, pi0, k = input().split()
a, b, pi0, k = float(a), float(b), float(pi0), int(k)
star = (1 - b) / ((1 - a) + (1 - b))


def power(x, e):
    result = 1.0
    while e:
        if e & 1:
            result *= x
        x *= x
        e >>= 1
    return result


print(f"{star + power(a + b - 1, k) * (pi0 - star):.6f}")
print(f"{star:.6f}")
```
