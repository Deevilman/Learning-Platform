---
slug: ctf-testkursus
lang: da
title: Testkursus i sikkerhed
short: Tre små udfordringer, der viser formatet for sikkerhedsøvelser.
color: "#dc2626"
icon: shield
level: gymnasium
estimated_weeks: 1
track: cyber
requires: []
recommended_before: []
next: []
topics:
  - { id: forsvar, name: Forsvar og analyse, weeks: [1] }
---

# Testkursus i sikkerhed

Udfordringerne her kører uden netværk og rører ingen andres systemer.

## Uge 1 — Se efter spor

> **Læringsmål:** Læse en log, et kodet budskab og en lille webside med øjne som en forsvarer.
> **Tidsforbrug:** ca. 1 t

### 🧠 Kernebegreber

**Kodning er ikke kryptering.** Base64 og ROT13 skjuler ikke noget for den, der ved, hvad de er.

```challenge
id: ctf-testkursus/loggen
titel: Hvad skete der i loggen?
miljoe: none
svaerhed: 1
emner: [forsvar]
opgave: |
  En server har skrevet denne log:

  ```
  09:00:01 login fejlede for admin fra 203.0.113.7
  09:00:02 login fejlede for admin fra 203.0.113.7
  09:00:02 login fejlede for admin fra 203.0.113.7
  09:00:03 login lykkedes for admin fra 203.0.113.7
  ```

  Hvilken slags angreb ligner det? Flaget er `FLAG{<angreb>-fra-en-adresse}`, hvor angrebet skrives med små bogstaver og bindestreg.
hints:
  - Mange forsøg på kort tid fra samme adresse.
  - Det engelske navn for at prøve kodeord efter hinanden.
writeup: |
  Mange mislykkede logins på sekunder fra én adresse og så et der lykkes, er et **brute force**-angreb. Forsvar: lås kontoen efter få forsøg, kræv to-faktor og giv besked ved mistænkelige mønstre.
flag_hash: sha256:6a11503417bba916:656c7577716cfb5dc0234dea2eaafb0ca4fa79a46b80d873409ec1b2f247e87d
```

```challenge
id: ctf-testkursus/noter
titel: En fil med mærkelige noter
miljoe: files
svaerhed: 1
emner: [forsvar]
opgave: |
  Hent filen herunder. Noterne er "skjult" med en meget gammel metode. Find flaget.
filer:
  - { navn: noter.txt, indhold: "Uhfx: SYNT{ebg13-re-vxxr-xelcgrevat}" }
hints:
  - Bogstaverne er flyttet et fast antal pladser i alfabetet.
  - Prøv at flytte hvert bogstav 13 pladser.
writeup: |
  Teksten er ROT13: hvert bogstav flyttes 13 pladser. Gør man det én gang til, får man klarteksten tilbage. ROT13 er kodning, ikke kryptering — der er ingen nøgle.
flag_hash: sha256:b0d5b7388d45ebdb:d985b171c2c66adef02498120f7ad62b1aecc87382e060138dde9a0383dcb429
```

```challenge
id: ctf-testkursus/kildekoden
titel: Login-siden, der stoler på browseren
miljoe: browser-sandbox
svaerhed: 2
emner: [forsvar]
opgave: |
  Siden herunder tjekker koden i selve browseren. Læs kildekoden (højreklik → *Inspicér*, eller se den herunder), og find flaget.
sandbox: |
  <!doctype html><html><body style="font-family:sans-serif">
  <p>Kode: <input id="k"> <button onclick="tjek()">Log ind</button></p><p id="svar"></p>
  <script>
    // hemmeligheden ligger i browseren — det er fejlen
    var hemmelig = atob("RkxBR3trb2Rlbi1zdG9kLWkta2lsZGVrb2Rlbn0=")
    function tjek() { document.getElementById('svar').textContent = document.getElementById('k').value === 'admin123' ? hemmelig : 'Forkert kode' }
  </script></body></html>
hints:
  - Alt, hvad browseren får, kan du også læse.
  - Hemmeligheden er base64-kodet. Afkod den, eller find koden i scriptet.
writeup: |
  Siden sender både den rigtige kode og hemmeligheden med til browseren, så enhver kan læse dem i kildekoden. Tjek altid adgang på serveren, og send aldrig hemmeligheder til klienten.
flag_hash: sha256:e4302769058b7cb9:badf9254452943d863896a4f4d34c807ca7bd0710d8ef83de9917ecfb5ff45f6
```

### ✏️ Øvelser

**1.1** ★ — Forklar med dine egne ord forskellen på kodning og kryptering.

### ✅ Løsninger

<details>
<summary>Løsning 1.1</summary>

Kodning (fx base64) kan vendes af alle uden en nøgle. Kryptering kræver en nøgle for at blive læst.

</details>

### 🏁 Checkpoint

- [ ] Jeg kan forklare, hvorfor kodning ikke er kryptering.
