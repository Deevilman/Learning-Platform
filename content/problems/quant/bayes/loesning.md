Bayes' sætning siger $P(K \mid A) = P(A \mid K)P(K)/P(A)$, og $P(A) = P(A \mid K)P(K) + P(A \mid \neg K)P(\neg K)$. Pointen er, at en god model stadig giver mange falske alarmer, når det, den leder efter, er sjældent: med $a = 1\,\%$ og $f = 5\,\%$ er kun ca. 15 % af alarmerne ægte.

```python
a, s, f = map(float, input().split())
print(f"{s * a / (s * a + f * (1 - a)):.4f}")
```
