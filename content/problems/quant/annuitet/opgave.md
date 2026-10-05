Et annuitetslån på $H$ kroner betales tilbage med den samme ydelse hver måned i $n$ år. Med den årlige rente $r$ er månedsrenten $i = r/12$, og der er $m = 12n$ ydelser. Ydelsen er
$$y = H \cdot \frac{i}{1-(1+i)^{-m}},$$
og hvis renten er 0, er den bare $y = H/m$.

**Input:** Én linje med $H$, $r$ og $n$. Her er $n$ et heltal.

**Output:** To linjer: ydelsen og de samlede renter $y \cdot m - H$, begge med 2 decimaler. Brug den ikke-afrundede ydelse, når du regner renterne ud.

**Grænser:** $0 < H \le 10^7$, $0 \le r \le 0.3$, $1 \le n \le 40$.
