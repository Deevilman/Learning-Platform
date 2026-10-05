Løs ligningssystemet $Ax = b$, hvor $A$ er en $n \times n$-matrix med præcis én løsning. Den slags systemer dukker op overalt i kvantitativ finans, fx i normalligningerne for regression og i porteføljeoptimering.

Brug Gauss-elimination: lav nuller under diagonalen kolonne for kolonne, og find så $x$ bagfra. Vælg i hver kolonne den række med den numerisk største værdi som pivot (delvis pivotering). Det undgår deling med 0 og giver små afrundingsfejl.

**Input:** Første linje er $n$. Så følger $n$ linjer med $n+1$ tal hver: rækken i $A$ efterfulgt af tallet i $b$.

**Output:** $x_1, \dots, x_n$, ét pr. linje, med 4 decimaler.

**Grænser:** $1 \le n \le 10$. Systemet har præcis én løsning.
