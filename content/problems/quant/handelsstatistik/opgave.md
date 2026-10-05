Når en strategi har lavet $n$ handler med gevinsterne og tabene $g_1, \dots, g_n$ (i kroner, ingen er 0), beregner man typisk:

- **hit rate**: andelen af handler med gevinst,
- **gennemsnitlig gevinst** og **gennemsnitligt tab** (tabet som et positivt tal),
- **profit factor**: summen af gevinster delt med summen af tab (positivt).

**Input:** Første linje er $n$. Anden linje er $g_1, \dots, g_n$.

**Output:** Fire linjer: hit rate (4 decimaler), gennemsnitlig gevinst (2 decimaler), gennemsnitligt tab (2 decimaler) og profit factor (4 decimaler). Er der ingen gevinster, er gennemsnitlig gevinst `0.00`; er der ingen tab, er gennemsnitligt tab `0.00`, og profit factor er `uendelig`.

**Grænser:** $1 \le n \le 10^5$, $0 < |g_i| \le 10^6$.
