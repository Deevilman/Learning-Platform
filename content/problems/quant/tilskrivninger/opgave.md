Banker tilskriver ofte renter flere gange om året. Med en årlig rente $r$ og $m$ tilskrivninger om året vokser $P$ kroner på $t$ år til
$$P\left(1+\frac{r}{m}\right)^{m t}.$$
Når $m$ går mod uendelig, får man kontinuerlig forrentning: $P e^{r t}$.

**Input:** Én linje med $P$, $r$, $m$ og $t$. Her er $m$ et heltal, og $m = 0$ betyder kontinuerlig forrentning. $t$ kan være et decimaltal.

**Output:** Beløbet efter $t$ år med 2 decimaler.

**Grænser:** $0 < P \le 10^6$, $0 \le r \le 0.5$, $0 \le m \le 365$, $0 \le t \le 50$.
