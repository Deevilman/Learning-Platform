# CONTENT_GUIDE — sådan tilføjer du indhold

Alt indhold ligger i `content/`. **Du skal aldrig rette i app-koden** for at tilføje et kursus, en øvelse, en generator, en interaktiv komponent eller et video-ID. Læg filer ind, og kør:

```bash
npm run content   # validerer alt og bygger public/data/
npm run dev       # se resultatet på http://localhost:5173
```

Fejl i indholdet stopper bygningen med fil og linjenummer, fx `✗ content/courses/quant/plan.md:1902: Øvelse 3.5 har ingen løsning`.

```text
content/
  source/                 # de uploadede planer og video-handoffs (input til importeren)
    sources.yaml          # hvilke kildefiler der bliver til hvilke kurser
  courses/<slug>/
    course.yaml           # metadata og emner
    plan.md               # læringsplanen (formatet herunder)
    videos.yaml           # video-nøgler → YouTube-ID'er
    overrides.yaml        # valgfri: emner, auto-tjek og indsatte komponenter pr. øvelse/uge
    extra-exercises/*.md  # valgfri: flere øvelser i samme format
  generators/<id>.ts      # opgavegeneratorer (uendelig træning)
  interactives/<id>.tsx   # interaktive komponenter
  ERRATA.md               # fundne fejl i planerne (planerne rettes aldrig i stilhed)
```

---

## 1. Tilføj en ny plan (et nyt kursus)

**Den hurtige vej (fra en plan og en handoff):**

1. Læg `Ny_Plan_Laeringsplan.md` og `Ny_Plan_Cloud_Handoff.md` i `content/source/`.
2. Tilføj tre linjer til `content/source/sources.yaml`:
   ```yaml
   - slug: kemi-a
     plan: Kemi_A_Laeringsplan.md
     handoff: Kemi_A_Cloud_Handoff.md
   ```
3. Kør `npm run import`. Det kopierer planen til `content/courses/kemi-a/plan.md` og bygger `videos.yaml` ud fra handoff'en. Importen kan køres igen, når planen opdateres; YouTube-ID'er, du selv har skrevet i `videos.yaml`, bevares.
4. Skriv `content/courses/kemi-a/course.yaml` (se 1.1).
5. Kør `npm run content`, og tjek tællingerne i tabellen.

**Uden importeren:** opret mappen `content/courses/<slug>/` med `course.yaml`, `plan.md` og evt. `videos.yaml` direkte.

### 1.1 `course.yaml`

```yaml
slug: kemi-a                       # skal være lig mappenavnet
title: "Kemi A"
short: "Fra atomer til reaktionskinetik"
color: "#db2777"                   # kursets farve i appen
icon: flask                        # ét ord
level: "gymnasium (A-niveau)"
estimated_weeks: 12
prerequisites: []                  # slugs på kurser, der skal være gennemført først
next: [aktuar]                     # "hvad du skal fortsætte med" — må gerne være et kursus, der ikke findes endnu
disclaimer: "…"                    # valgfri: vises øverst på kursussiden (bruges til finanskurserne)
expect: { weeks: 12, exercises: 150 }   # valgfri vagt: bygningen fejler, hvis tallene ikke passer
topics:                            # emner til svaghedsfinderen; hver uge bør have mindst ét
  - { id: atomer, name: "Atomer og periodesystemet", weeks: [1, 2] }
  - { id: kinetik, name: "Reaktionskinetik", weeks: [9] }
```

En øvelse får automatisk emnerne for sin uge. Det kan finjusteres i `overrides.yaml` (afsnit 2.3).

### 1.2 Formatet for `plan.md`

Importeren læser præcis dette format (det, de tre første planer bruger):

````markdown
# Titel på planen

Indledning, ansvarsfraskrivelse osv. (vises på kursussiden)

## Sådan bruger du planen        ← H2-afsnit før uge 1 bliver info-sider
## Overblik: 12 uger
## Notation: snydeark

## Uge 1 — Atomer

> **Læringsmål:** …
> **Tidsforbrug:** ca. 2 t video · ca. 5 t øvelser
> **Forudsætninger:** …

### 📺 Se

- [ ] **K1.1** Titel på videoen (Kanal)
  Fokus: hvad du skal holde øje med.
  Pause og tænk: et spørgsmål.
- [ ] **K1.2** En valgfri video (Kanal) — (valgfri)
- [ ] *(tilføjet)* Noget uden for playlisten (søg: "søgeord til YouTube")

### 🧠 Kernebegreber

Noter i Markdown med $\LaTeX$, $$display$$, \ce{H2O} (mhchem), tabeller og ```mermaid-diagrammer```.

### ✏️ Øvelser

**1.1** ★ — En beregning.

**1.2** ★★ 💻 — En programmeringsopgave.

**1.3** ★★★ 🗣️ — Forklar med egne ord.

### ✅ Løsninger

<details>
<summary>Løsning 1.1</summary>

Hint: første linje, der starter med "Hint:", bliver et separat hint.

Selve løsningen …

</details>

### 🔗 Forbindelse

Hvordan ugen hænger sammen med resten.

### 🏁 Checkpoint

Du er klar til næste uge, når du kan:
- [ ] …

## 🎓 Afsluttende projekt — Titel
### Del A — … (efter uge 4)          ← hver "Del X" bliver en del med tjekliste ("- [ ]")

## 🧠 Interview-træning               ← valgfri: spørgsmål "**1.** …" + <details><summary>Svar</summary>
## 🧪 Afsluttende selvtest            ← samme format som interview-træning
## 📚 Ressourcer                       ← H2-afsnit efter ugerne bliver info-sider
## 📖 Ordliste: dansk–engelsk          ← tabel | Dansk | Engelsk | Uge | → global ordliste og søgning
## 📝 Logbog-skabelon
````

Regler, som valideringen håndhæver:

- Ugerne hedder `## Uge N — titel` og er nummereret 1, 2, 3, … uden huller.
- Hver uge har `> **Læringsmål:**`, `### 🧠 Kernebegreber` og mindst én øvelse.
- Øvelser skrives `**N.k** ★★ [💻|🗣️] — tekst`. Nummeret skal starte med ugens nummer.
- Hver øvelse har præcis én `<details><summary>Løsning N.k</summary>`, og hver løsning har en øvelse.
- Display-matematik må gerne stå som `$$x = 1$$` eller `$$\begin{aligned} … \end{aligned}$$` på én linje.
- Sværhedsgrad: ★ = 1, ★★ = 2, ★★★ = 3. Type: 💻 = kode, 🗣️ = forklar; ellers "bevis", hvis opgaveteksten indeholder *vis/bevis/udled/…*, og ellers "beregning".

### 1.3 `videos.yaml`

```yaml
videos:
  K1.1:                       # playlist-nøglen fra planen (eller "<uge>.<nr>", hvis nøglen går igen)
    key: K1.1
    sources:                  # ét punkt i planen kan dække flere YouTube-videoer
      - title: "Atoms and the periodic table"
        channel: "Kanal"
        youtube: dQw4w9WgXcQ  # 11 tegn fra ?v=…
      - title: "Del 2"
        search: "søgeord"     # mangler ID → appen viser "Video mangler, indsæt URL" + YouTube-søgning
```

**Tilføj et video-ID:** skriv `youtube: <ID>` under kilden og kør `npm run content`. Du kan også indsætte URL'en direkte på ugesiden i appen; så gemmes den i dine data (og synkroniseres), men kun for dig.

---

## 2. Tilføj øvelser

### 2.1 Direkte i planen

Skriv øvelsen og løsningen i `plan.md` som ovenfor.

### 2.2 Uden at røre planen: `extra-exercises/*.md`

```markdown
## Uge 3 — Ekstra

### ✏️ Øvelser

**3.E1** ★★ — En ekstra øvelse til uge 3.

### ✅ Løsninger

<details>
<summary>Løsning 3.E1</summary>

Løsningen.

</details>
```

Brug numre med `E` (fx `3.E1`), så de aldrig kolliderer med planens numre.

### 2.3 `overrides.yaml`: emner, sværhedsgrad, auto-tjek og komponenter

```yaml
exercises:
  "3.5":
    add_topics: [statistics]          # læg et emne til (eller "topics:" for at erstatte)
    difficulty: 2
    check: { type: numeric, answer: 0.1667, tolerance: 0.001 }
  "selftest/4":                       # selvtest- og interviewspørgsmål: "selftest/N" og "interview/N"
    topics: [probability]

inserts:                              # indsæt Markdown (fx en interaktiv komponent) i en uge
  - week: 3
    section: notes                    # notes (standard) | exercises | connection | videos
    before: "**3. Uafhængighed.**"    # eller after: "…" — teksten skal findes præcis én gang i afsnittet
    markdown: '::interactive{id="bayes" prior="0.01"}'
```

**Auto-tjek-typer** (bruges kun, når svaret er entydigt — hellere intet tjek end et forkert):

| type | felter | eksempel på svar |
|---|---|---|
| `numeric` | `answer`, `tolerance`, `unit` (`"%"` betyder, at svaret skrives i procent) | `0,25`, `1/4`, `25 %` |
| `numeric-list` | `answers`, `tolerance`, `ordered` | `1; -2` |
| `choice` | `options`, `correct` (indeks fra 0) | – |
| `text` | `answers`, `caseSensitive` | `1000` |
| `output` | `expected` (forventet stdout fra en kodeopgave) | – |

Øvelser uden `check` vurderes af dig selv: *Kunne ikke · Delvist · Kunne med hint · Kunne*.

---

## 3. Tilføj en opgavegenerator

Én fil pr. generator i `content/generators/<id>.ts`. Den registreres automatisk.

```ts
import { defineGenerator, da, tex } from '@/lib/generators'

export default defineGenerator({
  id: 'k-molmasse',                 // = filnavnet
  title: 'Molar masse',
  course: 'kemi-a',
  topics: ['atomer'],               // skal findes i course.yaml
  difficulties: [1, 2],
  make(rng, d) {                    // rng er seedet: samme seed → samme opgave
    const n = rng.int(1, 5)
    const m = n * 18.015
    return {
      prompt: `Hvad er massen af $${n}$ mol $\\ce{H2O}$ i gram? (2 decimaler)`,
      hint: 'Molar masse af vand er ca. 18,015 g/mol.',
      solution: `$m = ${n} \\cdot 18{,}015 = ${tex(m, 2)}$ g.\n\nSvar: **${da(m, 2)}** g.`,
      check: { type: 'numeric', answer: Number(m.toFixed(2)), tolerance: 0.01 },
    }
  },
})
```

- Tekst er "mini-Markdown": afsnit, `**fed**`, `*kursiv*`, lister, tabeller, `$…$` og `$$…$$`.
- `da(x, 2)` skriver dansk decimaltal (`1.234,5`), `tex(x, 2)` det samme til brug inde i `$…$`.
- **Løsningen skal indeholde svaret.** Testen (`npm test`) kører 200 seeds pr. sværhedsgrad og tjekker, at tjekket accepterer sit eget svar, at løsningen nævner det, at der ikke står `NaN`/`undefined`, at KaTeX kan rendere alt, og at generatoren er deterministisk.
- **Rund de tal, du viser, *før* du regner videre med dem**, så svaret følger af tallene i opgaven.
- Hjælpefiler, der ikke er generatorer, skal starte med `_` (fx `_logic.ts`).

---

## 4. Tilføj en interaktiv komponent

Én fil pr. komponent i `content/interactives/<id>.tsx`, som default-eksporterer en React-komponent. Den registreres automatisk og indlæses først, når den vises.

```tsx
import { useState } from 'react'
import { Widget, Slider, Stat, fmt } from './_ui'

export const meta = { title: 'Idealgasloven', course: 'kemi-a' }

export default function IdealGas({ props }: { props: Record<string, string> }) {
  const [T, setT] = useState(Number(props.T) || 298)
  return (
    <Widget title="pV = nRT" icon="🎈">
      <Slider label="Temperatur (K)" value={T} min={100} max={600} onChange={setT} />
      <Stat label="Tryk ved 1 mol i 24,5 L (kPa)" value={fmt((8.314 * T) / 24.5, 1)} />
    </Widget>
  )
}
```

Brug den i en plan eller i `overrides.yaml` / `extra-exercises/*.md`:

```markdown
::interactive{id="ideal-gas" T="300"}
```

Attributterne kommer ind som `props` (strenge). Bygningen fejler, hvis `id` ikke findes. `content/interactives/_ui.tsx` har `Widget`, `Slider`, `NumberInput`, `Buttons`, `Stat`, `Chart` (linjer, punkter, søjler, trækbare punkter) og en seedet `rng` med `normal()`.

---

## 5. Kodeopgaver og nye sprog

Kodeblokke i ```` ```python ```` får knappen **▶ Kør i browseren** (Pyodide, kører lokalt i browseren). Blokke, der bygger videre på koden ovenfor, kan køres med **▶ Kør med koden ovenfor**. Lean-blokke (` ```lean `) får et link til Lean 4-editoren.

Et nyt sprog (C, assembly, …) tilføjes ved at implementere `CodeRunner` i `src/lib/runners/` og registrere det i `RUNNERS` i `src/lib/runners/index.ts`. Øvelserne skal ikke ændres. Sprog uden runner viser blot referenceløsningen.

## 6. Fejl i en plan

Ret aldrig fagligt indhold i stilhed. Skriv fejlen i `content/ERRATA.md` (fil, linje, hvad der er galt, forslag), og ret derefter kildefilen i `content/source/` og kør `npm run import`.

## 7. Opgavetekster: delspørgsmål, lange formler og henvisninger frem

Bygget (`npm run content`) gør tre ting ved øvelser, løsninger og hints — `plan.md` ændres ikke:

- **Delspørgsmål** skrevet på én linje, `(a) … (b) … (c) …`, bliver til en liste. Kun en række, der starter ved (a) og fortsætter i alfabetisk rækkefølge, tæller, så "brug (b)" inde i (c) bliver stående.
- **Lange formler** (over 90 tegn) i `$…$` flyttes ud på deres egen linje som display-matematik.
- **Henvisninger frem i kurset** ("vender tilbage i uge 9", "bruges i uge 7", "se uge 12", "forsmag på …" og "(uge N)" efter øvelsens egen uge) forvirrer, fordi eleven ikke har set stoffet endnu. `npm run forward-refs` finder dem og skriver forslag i `content/courses/<kursus>/forward-refs.yaml` med `action: review`. Gennemgå hvert forslag og sæt:
  - `remove` — teksten fjernes,
  - `replace` + `with: "…"` — teksten erstattes (fx "(Jensens ulighed, uge 4)" → "(Jensens ulighed)"),
  - `keep` — teksten bliver (fx når "vender tilbage" handler om noget andet).

  Bygget stopper, hvis et forslag står på `review`, eller hvis en tekst ikke findes præcis én gang i feltet (`prompt`, `hint` eller `solution`). Teksten må gerne være en del af en sætning.

## 8. "Tjek dig selv", hints og "Prøv selv"

**Tjek dig selv-spørgsmål** (bruges under øvelsen, i "Hvad kan du allerede?", i "Ugens test" og ved *Kun multiple choice*) skrives i `overrides.yaml`:

```yaml
exercises:
  '10.2':
    quiz:
      question: 'Hvad er det korrekte gennemsnitsafkast?'
      check: { type: numeric, answer: 2.5, tolerance: 0.05, unit: '%' }   # skriv selv
      distractors: [35, -22, 24.5]                                        # typiske fejl til multiple choice
      explain: 'Kort forklaring, der vises efter svaret.'
  '8.5':
    quiz:
      question: 'Hvilket aksiom udelukker $x \in x$?'
      options: ['Funderingsaksiomet', 'Ekstensionalitet', 'Udvalgsaksiomet']  # det første er det rigtige; rækkefølgen blandes
```

Bygget stopper, hvis et spørgsmål mangler `check` eller `options`, og en test tjekker, at præcis én svarmulighed er rigtig. Hver uge bør have mindst to automatisk tjekkede spørgsmål (Tjek dig selv eller regneopgaver i ugens emner) — en test holder øje med det.

**Hints**: alle øvelser får en hint-stige: først en strategi for opgavetypen, så planens `Hint:` (eller `hint:` i `overrides.yaml`), ellers første skridt af løsningen uden resultatet. Regneopgaver *skal* returnere `hint` (og kan give `moreHints` og `distractors`).

**Prøv selv**: en interaktiv komponent får sin intro fra `export const meta = { title, course, intro }` i `content/interactives/<id>.tsx`. Bygget sætter "**Prøv selv:** intro" over komponenten og viser den i kursets Prøv selv-oversigt. `intro="…"` på direktivet overskriver.
