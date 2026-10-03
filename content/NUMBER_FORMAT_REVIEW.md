# Tal, der skal tjekkes

Kurserne bruger amerikansk talformat: punktum som decimaltegn (0.25) og komma mellem tusinder (1,000). `npm run import` retter de sikre tilfælde, når planerne hentes ind. Tallene herunder kan betyde to ting, så de står uændret. Ret dem i planen i `content/source/` (eller lad dem stå, hvis de er rigtige), og kør `npm run import` igen.

87 steder:

## content/courses/quant.md

| Linje | Tal | Hvorfor | Sammenhæng |
|---:|---|---|---|
| 1061 | `18.650` | Tusindtalspunktum eller decimaltal? | og PCA \| Strang 18.06 L15–16, 18.650 L13 \| OLS fra bunden, beta, p |
| 1297 | `20.020` | Tusindtalspunktum eller decimaltal? | $0{,}0005\cdot 20.020 = 10{,}01$ |
| 1326 | `99,90` | Par/interval eller decimaltal? | 100,00 mod B1. Den næste bid (99,90) er under limitten, så de res |
| 1328 | `15.005` | Tusindtalspunktum eller decimaltal? | }95 + 50\cdot 100{,}20)/150 = 15.005/150 = 100{,}033$ |
| 2926 | `1,645` | Decimaltal (dansk) eller tusindtal (engelsk)? | på 5 %-niveau (kritisk værdi 1,645) med 10 års daglige data. (a) |
| 3468 | `0,9` | Par/interval eller decimaltal? | t korreleret med både 2 og 3 (0,9), må 2 og 3 også være ret stæ |
| 3501 | `1,214` | Decimaltal (dansk) eller tusindtal (engelsk)? | (før: 1,214), |
| 3585 | `1,354` | Decimaltal (dansk) eller tusindtal (engelsk)? | . Estimaterne 1,354 (SE ca. 0,05) og 1,074/0,585 |
| 3585 | `1,074` | Decimaltal (dansk) eller tusindtal (engelsk)? | aterne 1,354 (SE ca. 0,05) og 1,074/0,585 ligger inden for ca. 1– |
| 4452 | `1,1` | Par/interval eller decimaltal? | ilitetsklynger med ARCH/GARCH(1,1) og lave volatilitetsprognose |
| 4477 | `1,1` | Par/interval eller decimaltal? | k (ritvikmath) Fokus: GARCH(1,1) som "ARCH med hukommelse" og |
| 4533 | `1,1` | Par/interval eller decimaltal? | . - GARCH(1,1) (Bollerslev 1986): |
| 4573 | `1,1` | Par/interval eller decimaltal? | båndet. **9.4** ★ — En GARCH(1,1) for daglige afkast har |
| 4577 | `1,1` | Par/interval eller decimaltal? | langsigtsvariansen for GARCH(1,1) og prognoseformlen |
| 4593 | `1,1` | Par/interval eller decimaltal? | — Simulér 5000 dage af GARCH(1,1) med |
| 4901 | `1,1` | Par/interval eller decimaltal? | værdier, - [ ] beregne GARCH(1,1)-langsigtsvarians og flerdags |
| 4973 | `1,575` | Decimaltal (dansk) eller tusindtal (engelsk)? | giver den 1,575 / 2,531 / 3,255 for |
| 4973 | `2,531` | Decimaltal (dansk) eller tusindtal (engelsk)? | giver den 1,575 / 2,531 / 3,255 for |
| 4973 | `3,255` | Decimaltal (dansk) eller tusindtal (engelsk)? | giver den 1,575 / 2,531 / 3,255 for |
| 4973 | `1,539` | Decimaltal (dansk) eller tusindtal (engelsk)? | ntegration eller Monte Carlo: 1,539 / 2,508 / 3,241; approksimati |
| 4973 | `2,508` | Decimaltal (dansk) eller tusindtal (engelsk)? | on eller Monte Carlo: 1,539 / 2,508 / 3,241; approksimationen lig |
| 4973 | `3,241` | Decimaltal (dansk) eller tusindtal (engelsk)? | Monte Carlo: 1,539 / 2,508 / 3,241; approksimationen ligger alts |
| 5029 | `2,531` | Par/interval eller decimaltal? | ian, Gumbel-approksimationen (2,531) og Monte Carlo (ca. 2,51). ( |
| 5145 | `1,75` | Par/interval eller decimaltal? | -\|---\|---\|---\|---\| \| 1,2 \| A (1,75) \| −0,75; 0,30; 0,25; 1,85 \| |
| 5145 | `1,386` | Decimaltal (dansk) eller tusindtal (engelsk)? | 0,30; 0,25; 1,85 \| 1 \| 0,2 \| −1,386 \| \| 1,3 \| A (0,75) \| 0,25; 0, |
| 5146 | `0,75` | Par/interval eller decimaltal? | 1 \| 0,2 \| −1,386 \| \| 1,3 \| A (0,75) \| 0,25; 0,60; 0,15; 0,85 \| 2 |
| 5147 | `0,50` | Par/interval eller decimaltal? | 2 \| 0,4 \| −0,405 \| \| 1,4 \| A (0,50) \| 0,50; 1,50; 0,30; 0,60 \| 2 |
| 5148 | `1,50` | Par/interval eller decimaltal? | 2 \| 0,4 \| −0,405 \| \| 2,3 \| B (1,50) \| 0,50; −0,75; 0,20; 0,45 \| |
| 5148 | `1,386` | Decimaltal (dansk) eller tusindtal (engelsk)? | 0,75; 0,20; 0,45 \| 1 \| 0,2 \| −1,386 \| \| 2,4 \| D (0,85) \| 0,75; 0, |
| 5149 | `0,85` | Par/interval eller decimaltal? | 1 \| 0,2 \| −1,386 \| \| 2,4 \| D (0,85) \| 0,75; 0,15; 0,35; 0,20 \| 2 |
| 5150 | `1,85` | Par/interval eller decimaltal? | 2 \| 0,4 \| −0,405 \| \| 3,4 \| D (1,85) \| 1,75; 0,45; 0,25; −0,80 \| |
| 5150 | `1,386` | Decimaltal (dansk) eller tusindtal (engelsk)? | ,45; 0,25; −0,80 \| 1 \| 0,2 \| −1,386 \| Fx IS-blokke 1,2: A har |
| 5841 | `1,1` | Par/interval eller decimaltal? | s daglige afkast fra en GARCH(1,1)-model ( |
| 5918 | `1,000` | Decimaltal (dansk) eller tusindtal (engelsk)? | \| \|---\|---\|---\|---\| \| 0 \| 1,000 % \| 15,87 % \| 0,630 \| \| 1 \| 1 |
| 5919 | `1,086` | Decimaltal (dansk) eller tusindtal (engelsk)? | 0 % \| 15,87 % \| 0,630 \| \| 1 \| 1,086 % \| 17,24 % \| 0,580 \| \| 2 \| 1 |
| 5920 | `1,284` | Decimaltal (dansk) eller tusindtal (engelsk)? | 6 % \| 17,24 % \| 0,580 \| \| 2 \| 1,284 % \| 20,39 % \| 0,491 \| \| 3 \| 1 |
| 5921 | `1,269` | Decimaltal (dansk) eller tusindtal (engelsk)? | 4 % \| 20,39 % \| 0,491 \| \| 3 \| 1,269 % \| 20,14 % \| 0,496 \| (b) |
| 7212 | `100,00` | Par/interval eller decimaltal? | 0,01 er bedre end bedste bid (100,00) og lavere end ask, så ordren |
| 7634 | `1,645` | Decimaltal (dansk) eller tusindtal (engelsk)? | sakte fraktiler; de afrundede 1,645 og 2,326 giver 197 400 og 279 |
| 7634 | `2,326` | Decimaltal (dansk) eller tusindtal (engelsk)? | ktiler; de afrundede 1,645 og 2,326 giver 197 400 og 279 120 kr.) |

## content/courses/hedgefund.md

| Linje | Tal | Hvorfor | Sammenhæng |
|---:|---|---|---|
| 1224 | `2,000` | Decimaltal (dansk) eller tusindtal (engelsk)? | --\|---\|---\|---\| \| 1 \| +20 % \| 2,000 \| 118,000 \| 3,600 \| 114,400 \| |
| 1224 | `118,000` | Decimaltal (dansk) eller tusindtal (engelsk)? | --\|---\| \| 1 \| +20 % \| 2,000 \| 118,000 \| 3,600 \| 114,400 \| 114,400 \| |
| 1224 | `3,600` | Decimaltal (dansk) eller tusindtal (engelsk)? | 1 \| +20 % \| 2,000 \| 118,000 \| 3,600 \| 114,400 \| 114,400 \| \| 2 \| − |
| 1224 | `114,400` | Decimaltal (dansk) eller tusindtal (engelsk)? | % \| 2,000 \| 118,000 \| 3,600 \| 114,400 \| 114,400 \| \| 2 \| −25 % \| 2,2 |
| 1224 | `114,400` | Decimaltal (dansk) eller tusindtal (engelsk)? | \| 118,000 \| 3,600 \| 114,400 \| 114,400 \| \| 2 \| −25 % \| 2,288 \| 83,51 |
| 1225 | `2,288` | Decimaltal (dansk) eller tusindtal (engelsk)? | 400 \| 114,400 \| \| 2 \| −25 % \| 2,288 \| 83,512 \| 0 \| 83,512 \| 114,4 |
| 1225 | `83,512` | Decimaltal (dansk) eller tusindtal (engelsk)? | 4,400 \| \| 2 \| −25 % \| 2,288 \| 83,512 \| 0 \| 83,512 \| 114,400 \| \| 3 |
| 1225 | `83,512` | Decimaltal (dansk) eller tusindtal (engelsk)? | −25 % \| 2,288 \| 83,512 \| 0 \| 83,512 \| 114,400 \| \| 3 \| +30 % \| 1,6 |
| 1225 | `114,400` | Decimaltal (dansk) eller tusindtal (engelsk)? | 2,288 \| 83,512 \| 0 \| 83,512 \| 114,400 \| \| 3 \| +30 % \| 1,670 \| 106,8 |
| 1226 | `1,670` | Decimaltal (dansk) eller tusindtal (engelsk)? | 512 \| 114,400 \| \| 3 \| +30 % \| 1,670 \| 106,895 \| 0 \| 106,895 \| 114 |
| 1226 | `106,895` | Decimaltal (dansk) eller tusindtal (engelsk)? | 4,400 \| \| 3 \| +30 % \| 1,670 \| 106,895 \| 0 \| 106,895 \| 114,400 \| \| 4 |
| 1226 | `106,895` | Decimaltal (dansk) eller tusindtal (engelsk)? | +30 % \| 1,670 \| 106,895 \| 0 \| 106,895 \| 114,400 \| \| 4 \| +15 % \| 2,1 |
| 1226 | `114,400` | Decimaltal (dansk) eller tusindtal (engelsk)? | 670 \| 106,895 \| 0 \| 106,895 \| 114,400 \| \| 4 \| +15 % \| 2,138 \| 120,7 |
| 1227 | `2,138` | Decimaltal (dansk) eller tusindtal (engelsk)? | 895 \| 114,400 \| \| 4 \| +15 % \| 2,138 \| 120,792 \| 1,278 \| 119,513 \| |
| 1227 | `120,792` | Decimaltal (dansk) eller tusindtal (engelsk)? | 4,400 \| \| 4 \| +15 % \| 2,138 \| 120,792 \| 1,278 \| 119,513 \| 119,513 \| |
| 1227 | `1,278` | Decimaltal (dansk) eller tusindtal (engelsk)? | 4 \| +15 % \| 2,138 \| 120,792 \| 1,278 \| 119,513 \| 119,513 \| Fx år |
| 1227 | `119,513` | Decimaltal (dansk) eller tusindtal (engelsk)? | % \| 2,138 \| 120,792 \| 1,278 \| 119,513 \| 119,513 \| Fx år 4: |
| 1227 | `119,513` | Decimaltal (dansk) eller tusindtal (engelsk)? | \| 120,792 \| 1,278 \| 119,513 \| 119,513 \| Fx år 4: |
| 1351 | `35,65` | Par/interval eller decimaltal? | mod 138,20 netto: forskellen (35,65) er større end gebyrerne (27, |
| 1351 | `27,31` | Par/interval eller decimaltal? | ,65) er større end gebyrerne (27,31), fordi betalte gebyrer også |
| 1509 | `2.040` | Tusindtalspunktum eller decimaltal? | $PV = 2.040/1{,}08^3 = 1619.42$ |
| 1620 | `1.350` | Tusindtalspunktum eller decimaltal? | $= 218{,}4/1.350 \approx 16{,}2\,\%$ |
| 1674 | `3.280` | Tusindtalspunktum eller decimaltal? | $3.280 - 632{,}8 = 2647.2$ |
| 1780 | `21,83` | Par/interval eller decimaltal? | Medianen (21,83) ligger under basis (23,98), |
| 1780 | `23,98` | Par/interval eller decimaltal? | n (21,83) ligger under basis (23,98), fordi de simulerede interva |
| 1901 | `0,9` | Par/interval eller decimaltal? | ), B 30 (0,9), C 35 (1,1); short D 25 (1,5 |
| 1901 | `1,1` | Par/interval eller decimaltal? | ), B 30 (0,9), C 35 (1,1); short D 25 (1,5), E 20 (0,7 |
| 1901 | `1,5` | Par/interval eller decimaltal? | 0,9), C 35 (1,1); short D 25 (1,5), E 20 (0,7), F 15 (1,0). Ber |
| 1901 | `0,7` | Par/interval eller decimaltal? | 1,1); short D 25 (1,5), E 20 (0,7), F 15 (1,0). Beregn gross, n |
| 1901 | `1,0` | Par/interval eller decimaltal? | D 25 (1,5), E 20 (0,7), F 15 (1,0). Beregn gross, net og beta-j |
| 2203 | `2,778` | Decimaltal (dansk) eller tusindtal (engelsk)? | (bund ca. 2,778). Efter Tysklands genforening |
| 2225 | `6,555` | Decimaltal (dansk) eller tusindtal (engelsk)? | , hvis spot om et år er 6,90, 6,555 (−5 %) og 7,245 (+5 %). (b) H |
| 2225 | `7,245` | Decimaltal (dansk) eller tusindtal (engelsk)? | t år er 6,90, 6,555 (−5 %) og 7,245 (+5 %). (b) Hvor meget kan US |
| 2239 | `6,858` | Decimaltal (dansk) eller tusindtal (engelsk)? | ; 2,3 %; 1 år), USDDKK (6,90; 6,858; 2 %; 4,5 %; 0,25 år) og GBPD |
| 2297 | `1,023` | Decimaltal (dansk) eller tusindtal (engelsk)? | EUR spot, placér til 2,3 % → 1,023 mio. EUR, sælg dem på termin |
| 2498 | `0,0` | Decimaltal i en formel? Skriv 0.5 | $\min(\max(V-S_0,0),K)/K$ |
| 2619 | `1,825` | Decimaltal (dansk) eller tusindtal (engelsk)? | forventningen fra 2,55 % til 1,825 % (ca. 28 % lavere) og skaber |
| 2832 | `3,625` | Decimaltal (dansk) eller tusindtal (engelsk)? | d redningen skød bankerne ca. 3,625 mia. USD ind mod 90 % af fond |
| 3060 | `0,477` | Par/interval eller decimaltal? | decimal). Andelen uden krak (0,477) svarer til |
| 3193 | `1,539` | Decimaltal (dansk) eller tusindtal (engelsk)? | ormalfordelte variable er ca. 1,539 ( |
| 3193 | `2,508` | Decimaltal (dansk) eller tusindtal (engelsk)? | ), 2,508 ( |
| 3193 | `3,241` | Decimaltal (dansk) eller tusindtal (engelsk)? | ) og 3,241 ( |
| 4231 | `0,78` | Par/interval eller decimaltal? | værdier, og Lo-korrektionen (0,78) fjerner det meste af oppustn |
| 4527 | `118,924` | Decimaltal (dansk) eller tusindtal (engelsk)? | fter krystalliseringen er HWM 118,924; i år 2 ligger fonden under, |
| 4781 | `1,000` | Decimaltal (dansk) eller tusindtal (engelsk)? | d HWM* (andelsværdi starter i 1,000): - År 1: management fee |
| 4783 | `1,028` | Decimaltal (dansk) eller tusindtal (engelsk)? | ; andelsværdi 1,028. - År 3: management fee |
| 5061 | `35,9` | Par/interval eller decimaltal? | igger lidt over bear-værdien (35,9), så markedet prissætter næst |
