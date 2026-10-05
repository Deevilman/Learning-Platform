Du kan satse en andel $f$ af din formue på et spil, der med sandsynlighed $p$ giver $b$ gange indsatsen i gevinst og ellers koster indsatsen. Kelly-andelen, der giver den største forventede log-vækst, er
$$f^* = p - \frac{1-p}{b}.$$
Hvis $f^* < 0$, skal du ikke spille, så sæt $f^* = 0$. Den forventede log-vækst pr. spil er
$$g = p\ln(1 + f^* b) + (1-p)\ln(1 - f^*).$$

**Input:** Én linje med $p$ og $b$.

**Output:** To linjer: $f^*$ med 4 decimaler og $g$ med 6 decimaler.

**Grænser:** $0 < p < 1$, $0 < b \le 100$.
