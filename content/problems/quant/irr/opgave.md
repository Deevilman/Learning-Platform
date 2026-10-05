Den interne rente (IRR) er den rente $r$, der gør nutidsværdien af betalingerne lig med 0:
$$\sum_{t=0}^{n} \frac{c_t}{(1+r)^t} = 0.$$
Her er $c_0 < 0$ (du investerer), og de senere betalinger er $\ge 0$ med mindst én $> 0$. Så falder nutidsværdien, når $r$ vokser, og der er præcis én løsning.

**Input:** Én linje med $c_0, c_1, \dots, c_n$.

**Output:** Den interne rente som decimaltal med 4 decimaler, fx `0.1000` for 10 %.

**Grænser:** $1 \le n \le 50$. Løsningen ligger mellem $-0.9$ og $10$.
