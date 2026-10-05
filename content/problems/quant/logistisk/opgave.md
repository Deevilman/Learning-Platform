En logistisk regression forudsiger sandsynligheden for, at aktien stiger i morgen ud fra $d$ features $x_1, \dots, x_d$:
$$p = \sigma(w_0 + w_1 x_1 + \dots + w_d x_d), \qquad \sigma(z) = \frac{1}{1 + e^{-z}}.$$
Modellen forudsiger "op", når $p \ge 0.5$.

**Input:** Første linje er $d$ og $n$. Anden linje er vægtene $w_0, w_1, \dots, w_d$. Så følger $n$ linjer med $d$ features og det faktiske udfald (1 for op, 0 for ned).

**Output:** $n$ linjer med $p$ (4 decimaler) og til sidst modellens træfsikkerhed: andelen af linjer, hvor forudsigelsen passer med udfaldet (4 decimaler).

**Grænser:** $1 \le d \le 20$, $1 \le n \le 10^4$.
