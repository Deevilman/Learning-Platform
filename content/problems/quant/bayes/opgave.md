En model skal advare om dage med et markedskrak. På en tilfældig dag er der krak med sandsynligheden $a$. Modellen giver alarm med sandsynligheden $s$, når der er krak, og med sandsynligheden $f$, når der ikke er (en falsk alarm). Med Bayes' sætning er sandsynligheden for krak, når modellen har givet alarm,
$$P(\text{krak} \mid \text{alarm}) = \frac{s \cdot a}{s \cdot a + f \cdot (1-a)}.$$

**Input:** Én linje med $a$, $s$ og $f$.

**Output:** $P(\text{krak} \mid \text{alarm})$ med 4 decimaler.

**Grænser:** $0 \le a, s, f \le 1$, og nævneren er ikke 0.
