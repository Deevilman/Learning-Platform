En børs matcher limitordrer i en ordrebog efter pris-tid-prioritet. Ordrerne kommer én ad gangen:

- En **købsordre** `BUY p q` handler med de hvilende salgsordrer, hvis pris er $\le p$: først den laveste pris, og ved samme pris den ældste. Hver handel sker til den hvilende ordres pris og for så mange stk., som begge kan. Er der noget tilbage af købsordren, når der ikke er flere salgsordrer til $\le p$, hviler resten i bogen.
- En **salgsordre** `SELL p q` gør det samme med de hvilende købsordrer, hvis pris er $\ge p$: først den højeste pris, og ved samme pris den ældste.

**Input:** Første linje er $n$. Så følger $n$ ordrer, én pr. linje.

**Output:** Først én linje pr. handel i den rækkefølge, de sker: `pris antal`. Derefter `bedste bud: X` og `bedste udbud: Y`, hvor X er den højeste hvilende købspris og Y den laveste hvilende salgspris (eller `-`, hvis der ingen er).

**Grænser:** $1 \le n \le 10^5$, priser og antal er hele tal mellem 1 og $10^6$.
