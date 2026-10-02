# Errata for læringsplanerne

Planerne rettes aldrig i stilhed. Fundne fejl skrives her med fil, linje, hvad der er galt og et forslag. Rettelser laves i kildefilen i `content/source/`, hvorefter `npm run import` køres.

## Gennemgang ved import (2026-10-02)

Hvad der automatisk er kontrolleret for alle tre planer:

- **Struktur:** 42 uger; 528 øvelser med præcis én løsning hver (177 / 205 / 146); 20 + 20 + 20 selvtest-spørgsmål og 15 interviewspørgsmål med svar; alle projektdele har tjeklister. Ingen fejl.
- **Matematik:** alle formler kan renderes af KaTeX. Ingen fejl i planerne. (Én blok i Foundations, løsning 5.4, skriver `$$\begin{aligned}` på samme linje som `$$`. Det er gyldigt i Obsidian og GitHub, og importeren håndterer det nu.)
- **Python:** alle 108 Python-blokke er kørt. De 101 selvstændige blokke kører uden fejl, både i CPython og i Pyodide. De 7 øvrige er bevidst afhængige af anden kode:
  - Quant, linje 937, 2642, 3053, 4299 og 5078: valgfri numpy/pandas-variant, der genbruger koden ovenfor.
  - Foundations, linje 3739 (løsning 9.12): `from prop import parse` forudsætter parseren fra 9.11 gemt som `prop.py`.
  - Foundations, linje 4514 (løsning 11.11): forudsætter `run_tm`, `BLANK` og `inc` fra løsning 10.11.

  Det står allerede i planerne og er altså ikke fejl.

## Fundne faglige fejl

Ingen endnu.

| Plan | Linje | Problem | Forslag | Status |
|---|---|---|---|---|
| | | | | |
