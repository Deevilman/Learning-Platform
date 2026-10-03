---
slug: testkursus
lang: da
title: Testkursus i logik
short: Et lille kursus på to uger, der viser hele formatet.
color: "#0ea5e9"
icon: logic
level: gymnasium
estimated_weeks: 2
track: matematik
requires: []
recommended_before: []
next: []
topics:
  - { id: udsagn, name: Udsagn og sandhedsværdier, weeks: [1] }
  - { id: kvantorer, name: Kvantorer, weeks: [2] }
videos:
  - { key: T1, youtube: EXUxMOM03Bo, title: "Start Learning Logic 1", channel: The Bright Side of Mathematics }
  - { key: T2, youtube: O4ndIDcDSGc, title: "Gödel's Incompleteness Theorem", channel: Numberphile }
overrides:
  exercises:
    "1.1":
      quiz:
        question: "Hvilket af disse er et udsagn?"
        options: ['"7 er et primtal."', '"Luk døren!"', '"Er det sandt?"']
        explain: Et udsagn er enten sandt eller falsk.
---

# Testkursus i logik

Et kort kursus, der bruges til at afprøve kursusfiler.

## Uge 1 — Udsagn

> **Læringsmål:** Kende forskel på udsagn og andre sætninger.
> **Tidsforbrug:** ca. 1 t

### 📺 Se

- [ ] **T1** Start Learning Logic 1 (The Bright Side of Mathematics)
  Fokus: hvad et udsagn er.

```lesson
video: T1
maal:
  - Forklare, hvad et udsagn er.
  - Afgøre sandhedsværdien af simple udsagn.
opsummering: Et udsagn er en sætning, der enten er sand eller falsk — aldrig begge dele.
spoergsmaal:
  - spoergsmaal: Er "Luk døren!" et udsagn?
    svar: Nej
    muligheder: [Nej, Ja]
  - spoergsmaal: Hvad er sandhedsværdien af "2 + 2 = 4"?
    svar: Sand
    muligheder: [Sand, Falsk]
```

### 🧠 Kernebegreber

**Udsagn.** En sætning, der enten er sand (S) eller falsk (F). "$7$ er et primtal" er et udsagn; "Luk døren!" er ikke.

**Negation.** $\neg p$ er sand, netop når $p$ er falsk.

### ✏️ Øvelser

**1.1** ★ — Hvilke af følgende er udsagn? (a) "$7$ er et primtal." (b) "Luk døren!"

**1.2** ★★ — Hvad er sandhedsværdien af $\neg(2 + 2 = 5)$?

### ✅ Løsninger

<details>
<summary>Løsning 1.1</summary>

(a) Udsagn, sand. (b) Ikke et udsagn.

</details>

<details>
<summary>Løsning 1.2</summary>

Hint: Find først sandhedsværdien af $2 + 2 = 5$.

$2 + 2 = 5$ er falsk, så negationen er sand.

</details>

```opgaveskabelon
id: testkursus/addition
emner: [udsagn]
svaerhed: 1
type: tal
variabler:
  a: { interval: [2, 20] }
  b: { interval: [2, 20] }
beregn: { s: a + b }
opgave: "Hvad er ${a} + {b}$?"
svar: { udtryk: s, tolerance: 0 }
hints: ["Læg tallene sammen."]
loesning: "${a} + {b} = {s}$"
```

### 🏁 Checkpoint

Du er klar til næste uge, når du kan:
- [ ] forklare, hvad et udsagn er.

## Uge 2 — Kvantorer

> **Læringsmål:** Læse og negere udsagn med "for alle" og "der findes".

### 📺 Se

- [ ] **T2** Gödel's Incompleteness Theorem (Numberphile)

```lesson
video: T2
maal:
  - Vide, at nogle sande udsagn ikke kan bevises.
opsummering: Gödel viste, at enhver tilstrækkeligt stærk, konsistent teori har sande udsagn, den ikke kan bevise.
spoergsmaal:
  - spoergsmaal: Kan en konsistent teori for aritmetikken bevise alle sande udsagn om tallene?
    svar: Nej
    muligheder: [Nej, Ja]
```

### 🧠 Kernebegreber

**Kvantorer.** $\forall x\, P(x)$ betyder "for alle $x$ gælder $P(x)$", og $\exists x\, P(x)$ betyder "der findes et $x$ med $P(x)$".

**Negation.** $\neg \forall x\, P(x) \equiv \exists x\, \neg P(x)$.

### ✏️ Øvelser

**2.1** ★ — Negér $\forall x\, (x > 0)$.

**2.2** ★★ — Er $\exists x \in \mathbb{N}\, (x + 1 = 0)$ sandt?

### ✅ Løsninger

<details>
<summary>Løsning 2.1</summary>

$\exists x\, (x \le 0)$.

</details>

<details>
<summary>Løsning 2.2</summary>

Falsk: for alle $x \in \mathbb{N}$ er $x + 1 \ge 1$.

</details>

### 🏁 Checkpoint

Du er klar, når du kan:
- [ ] negere et udsagn med kvantorer.

## 📖 Ordliste: dansk–engelsk

| Dansk | Engelsk | Uge |
|---|---|---|
| udsagn | proposition | 1 |
| kvantor | quantifier | 2 |
