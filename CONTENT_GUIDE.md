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

## 0. Et kursus i én fil (anbefalet)

Et helt kursus kan ligge i **én Markdown-fil**: `content/courses/<slug>.md`, eller uploadet i appen under *Mere → Kurser → Tilføj kursus*. Filen har to dele:

1. **Front matter** (YAML mellem to linjer `---`): slug, sprog, titel, farve, spor, rækkefølge, emner og videoer. Felterne er beskrevet i [`content/course-pack.schema.json`](content/course-pack.schema.json), som editorer som VS Code kan bruge til autoudfyldning.
2. **Planen** i skabelonen fra afsnit 1.2, plus disse valgfri blokke, der kan stå hvor som helst i planen:
   - ` ```lesson ` — til én video: læringsmål (`maal`), `opsummering` og 2–4 `spoergsmaal` med svar.
   - ` ```opgaveskabelon ` — en regneopgave med nye tal hver gang (se afsnit 9).
   - ` ```problem ` — en programmeringsopgave med test (kodedommeren).
   - ` ```challenge ` — en sikkerhedsudfordring.

**Tal** skrives i amerikansk format: punktum som decimaltegn og komma mellem tusinder (`0.25`, `1,234.5`). I formler skrives tal uden tusindtalsseparator (`$1234.5$`), og `{,}` bruges ikke. Bygget advarer om tal, der ligner dansk format (`0,25`). Planer i `content/source/` konverteres ved `npm run import`, og tvivlstilfælde skrives i `content/NUMBER_FORMAT_REVIEW.md`.

| Felt | Krævet | Betydning |
|---|---|---|
| `slug` | ja | Kursets id i adresser og fremskridt: små bogstaver, tal og `-`. Må ikke ændres. |
| `lang` | ja | `da` eller `en`. En udgave på det andet sprog ligger i `<slug>.<lang>.md` (fx `quant.en.md`) med samme slug; fremskridt deles, og appen viser udgaven på elevens sprog. Skriv udgaven selv — ingen maskinoversættelse. |
| `title` | ja | Kursets navn. |
| `topics` | ja | Emner med de uger, de hører til (`{ id, name, weeks }`). |
| `short`, `color`, `icon`, `level`, `estimated_weeks` | nej | Til kursuslisten og kursets farve. |
| `track` | nej | Gruppe på kursuskortet, fx `matematik`. |
| `requires`, `recommended_before`, `next` | nej | Rækkefølge: anbefalinger, aldrig låst. |
| `exam` | nej | `htx` eller `olympiade` (eksamenstræning). |
| `videos` | nej | Liste med `key` (som i planen), `youtube` (11 tegn), `title`, `channel`. `access: steady` + `url` for indhold, der kun er for skaberens støtter. `remove: true` fjerner en plads. |
| `overrides`, `forward_refs` | nej | Det samme som `overrides.yaml` og `forward-refs.yaml`. |

Fejl vises på dansk med linjenummer i filen. De tre første kurser findes også som mapper (`course.yaml`, `plan.md`, …); begge former virker.

### Komplet minimalt eksempel

Dette er `tests/fixtures/testkursus.md`, som testene bygger og uploader:

`````markdown
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
`````

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

Én fil pr. generator i `content/generators/<id>.ts`. Den registreres automatisk. Kan opgaven skrives som en opgaveskabelon (afsnit 9), så gør det i stedet — den kræver ingen kode og kan også ligge i en kursusfil.

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

## 9. Opgaveskabeloner (regneopgaver uden kode)

En opgaveskabelon laver en ny udgave af samme opgave hver gang: nye tal, samme metode. Skriv den i en ` ```opgaveskabelon `-blok i kursusfilen (eller som `content/templates/<id>.yaml` for sitets egne kurser). Den bliver til en almindelig regneopgave: den dukker op i Træn, i ugens Øv mere, i placeringstesten og som multiple choice.

| Felt | Betydning |
|---|---|
| `id` | Unikt navn, fx `kemi/stofmaengde`. Skift det aldrig — fremskridt hænger på det. |
| `emner` | Emne-id'er fra `topics` i front matter. |
| `svaerhed` | `1`, `2`, `3` eller en liste. Brug `niveauer` i stedet, hvis indholdet skal være forskelligt pr. sværhed. |
| `type` | `tal`, `multiple-choice`, `tekst` eller `udtryk`. (Kodeopgaver skrives som ` ```problem `.) |
| `variabler` | `interval: [min, max]` (heltal; `decimaler: 2` eller `trin: 0.5` for kommatal; `ikke: [0]` udelukker værdier), `vaelg: [...]` (tal eller tekst), `vaelg_par_med: x` (samme plads som variablen `x`), `primtal: [min, max]`, `fortegn: true` (+1 eller −1). |
| `beregn` | Navngivne udregninger i rækkefølge, fx `n: m / M`. |
| `betingelser` | Udtryk, der skal være sande, fx `a != b`. Ellers trækkes nye tal (op til 200 gange). |
| `opgave`, `hints`, `loesning` | Tekst med `{navn}` for en værdi og `{navn:.2f}` for 2 decimaler. Matematik i `$…$` som ellers. `_en`-udgaver bruges, når kurset vises på engelsk. |
| `svar` | `udtryk` (tal-svaret), `tolerance` (`0.01` eller `"0.5%"`), `decimaler`, `enhed`; `tekst` for tekst-svar (`maengde: true` = rækkefølgen er ligegyldig); `variabler: [x]` for typen `udtryk`. |
| `distraktorer` | Forkerte svar med `udtryk` eller `tekst` og en `forklaring`, som eleven ser efter et forkert valg. |

Udtryk kan bruge `+ - * / ^ %`, sammenligninger, `and`/`or`/`not`, `pi`, `e` og funktionerne `sqrt ln log10 log exp sin cos tan asin acos atan abs floor ceil round(x, d) min max gcd binom fact`. Andet kan ikke køres — skabelonen kan ikke tilgå noget uden for sig selv.

**Kontrol:** bygget (og upload i appen) kører hver skabelon på 200 seeds pr. sværhed og stopper, hvis et tal bliver NaN eller uendeligt, hvis tjekket ikke godkender sit eget svar, hvis løsningen ikke nævner svaret, eller hvis en distraktor er lig med svaret. Fejlen peger på blokkens linje og nævner det seed, der fejlede.

**Pas på kommaer i YAML:** skriv udtryk med komma i anførselstegn, når de står i `{ … }`: `beregn: { n: 'max(a, b)' }`.

### Eksempel 1 — tal, par af værdier og enhed

```yaml
id: kemi/stofmaengde
emner: [stofmaengde]
svaerhed: [1, 2]
type: tal
variabler:
  stof: { vaelg: [H_2O, CO_2, NaCl] }
  M: { vaelg: [18.02, 44.01, 58.44], vaelg_par_med: stof }
  m: { interval: [1, 100], decimaler: 1 }
beregn: { n: m / M }
betingelser: ['n > 0.05']
opgave: 'Hvor mange mol er der i {m} g $\ce{{stof}}$?'
svar: { udtryk: n, tolerance: '1%', enhed: mol, decimaler: 3 }
hints: ['Brug $n = m/M$.', 'Molmassen er {M} g/mol.']
loesning: '$n = {m} / {M} = {n:.3f}$ mol'
distraktorer:
  - { udtryk: 'm * M', forklaring: 'Du har ganget i stedet for at dividere.' }
```

### Eksempel 2 — multiple choice med forklaringer

```yaml
id: matematik/gangetabel
emner: [regning]
svaerhed: 1
type: multiple-choice
variabler: { a: { interval: [2, 9] }, b: { interval: [2, 9] } }
betingelser: ['a != b']
beregn: { p: a * b }
opgave: 'Hvad er ${a} \cdot {b}$?'
svar: { udtryk: p }
hints: ['Gang tallene.']
loesning: '${a} \cdot {b} = {p}$'
distraktorer:
  - { udtryk: 'a + b', forklaring: 'Du har lagt sammen.' }
  - { udtryk: 'p + a', forklaring: 'Du har talt én gang for meget.' }
  - { udtryk: 'p - b', forklaring: 'Du har talt én gang for lidt.' }
```

### Eksempel 3 — tekst-svar (en mængde)

```yaml
id: logik/maengde
emner: [maengder]
svaerhed: 1
type: tekst
variabler: { a: { interval: [1, 5] } }
beregn: { b: a + 1, c: a + 2 }
opgave: 'Skriv mængden af hele tal fra {a} til {c}.'
svar: { tekst: '{{a}, {b}, {c}}', maengde: true }
hints: ['Der er tre tal.']
loesning: 'Svaret er {{a}, {b}, {c}}. Rækkefølgen er ligegyldig i en mængde.'
```

### Eksempel 4 — udtryk som svar

```yaml
id: matematik/differentiation
emner: [differentialregning]
svaerhed: 2
type: udtryk
variabler: { k: { interval: [2, 9] }, n: { interval: [2, 5] } }
beregn: { kn: k * n, n1: n - 1 }
opgave: 'Differentiér $f(x) = {k}x^{n}$.'
svar: { udtryk: '{kn}*x^{n1}', variabler: [x] }
hints: ['Potensreglen: $(x^n)'' = n x^{n-1}$.']
loesning: "$f'(x) = {k} \\cdot {n} x^{n1} = {kn}x^{n1}$"
```

Eleven kan skrive svaret på enhver måde, der giver det samme (fx `2*3*x^2` eller `6x^2` skrevet som `6*x^2`). Svaret tjekkes ved at sætte tal ind.

### Eksempel 5 — forskelligt indhold pr. sværhed

```yaml
id: q-present-value
emner: [time-value]
type: tal
niveauer:
  1:
    variabler: { C: { vaelg: [100, 500, 1000] }, n: { interval: [2, 6] }, rp: { interval: [3, 10] } }
    beregn: { r: rp / 100, g: 1 + r, pv: C / g^n }
    opgave: 'Hvad er nutidsværdien af ${C}$ kr. om ${n}$ år ved ${rp}\,\%$? (2 decimaler)'
    svar: { udtryk: pv, decimaler: 2, tolerance: 0.02 }
    hints: ['$PV = C/(1+r)^n$.']
    loesning: '$PV = {C} / {g}^{{n}} = {pv:.2f}$ kr.'
  2:
    variabler: { C: { vaelg: [1000, 5000] }, n: { interval: [5, 30] }, rp: { interval: [3, 10] } }
    beregn: { r: rp / 100, g: 1 + r, pv: C * (1 - g^(-n)) / r }
    opgave: 'En annuitet betaler ${C}$ kr. om året i ${n}$ år. Find nutidsværdien ved ${rp}\,\%$. (2 decimaler)'
    svar: { udtryk: pv, decimaler: 2, tolerance: 0.05 }
    hints: ['$PV = C\,\frac{1-(1+r)^{-n}}{r}$.']
    loesning: '$PV = {pv:.2f}$ kr.'
```

Felter under et niveau erstatter felterne ovenfor for den sværhed. Se flere i `content/templates/`.
