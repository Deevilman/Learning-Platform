En investering giver betalingerne $c_0, c_1, \dots, c_n$ på tidspunkterne $0, 1, \dots, n$ år. En negativ betaling er en udgift. Med diskonteringsrenten $r$ er nutidsværdien
$$NPV = \sum_{t=0}^{n} \frac{c_t}{(1+r)^t}.$$
Er nutidsværdien positiv, er investeringen bedre end at få renten $r$.

**Input:** Første linje er $r$. Anden linje er betalingerne $c_0, c_1, \dots, c_n$ adskilt af mellemrum.

**Output:** Nutidsværdien med 2 decimaler.

**Grænser:** $0 \le r \le 1$, $0 \le n \le 100$, $|c_t| \le 10^6$.
