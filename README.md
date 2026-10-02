# Det seje — personlig læringsplatform

En statisk webapp, der gør Olivers læringsplaner (Markdown) til kurser med indlejrede videoer, et stort opgavebibliotek, uendelig træning med opgavegeneratorer, spaced repetition, en svaghedsfinder, interaktive forklaringer og Python i browseren. Alt, hvad du laver, gemmes lokalt og kan synkroniseres mellem enheder.

**Kurser i dag:** Matematikkens grundlag (14 uger) → Quant Trading & Research (16 uger) → Hedgefonde (12 uger).
**Nye kurser** tilføjes ved at lægge filer i `content/`. Se [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## Kom i gang

Kræver Node 20+ (testet med Node 22).

```bash
npm install
npm run dev          # bygger indholdet og starter http://localhost:5173
```

| Kommando | Hvad den gør |
|---|---|
| `npm run import` | Kildefiler i `content/source/` → kursusmapper (`plan.md` + `videos.yaml`). Kør igen, når en plan er opdateret. |
| `npm run content` | Validerer alle kurser og bygger `public/data/` (JSON pr. kursus og uge) + kopierer Pyodide til `public/pyodide/`. Fejler med fil:linje. |
| `npm run dev` | Udviklingsserver. |
| `npm run build` | Indhold + typecheck + produktionsbuild i `dist/`. |
| `npm run preview` | Server `dist/` lokalt. |
| `npm test` | Unit-tests (Vitest): importer, 43 generatorer × 200 seeds, mestringsmodel, scheduler, træning, lagring, eksport/import, udvidelighed. |
| `npm run test:e2e` | Playwright-røgtests mod `dist/` (kør `npm run build` først): navigation, KaTeX, persistens efter genindlæsning, eksport → import i en ren profil, træning og Python i browseren. |

## Deploy (GitHub Pages)

Workflowet `.github/workflows/deploy.yml` tester og bygger ved hvert push, og deployer ved push til `main`.

1. **Repoet er privat.** GitHub Pages fra et privat repo kræver GitHub Pro. Det er gratis for elever via [GitHub Student Developer Pack](https://education.github.com/pack). Alternativt kan repoet gøres offentligt. (Bemærk: selve Pages-siden er offentlig, også fra et privat repo.)
2. Gå til **Settings → Pages**, og vælg **Source: GitHub Actions**.
3. Merge til `main` (eller kør workflowet manuelt under **Actions**). Siden ligger derefter på `https://deevilman.github.io/Learning-Platform/`.

Appen bruger relative stier og hash-routing (`#/kursus/…`), så den virker under enhver sti uden server-konfiguration.

## Synkronisering (Supabase)

Data ligger altid lokalt i browseren (IndexedDB). Når du er logget ind, synkroniseres de også med Supabase, og flere enheder flettes post for post (nyeste ændring vinder).

Engangsopsætning i Supabase-projektet:

1. **SQL Editor:** kør [`supabase/schema.sql`](supabase/schema.sql). Det opretter tabellen `records` med Row Level Security, så hver bruger kun kan se sine egne rækker.
2. **Authentication → Providers → Email:** slå e-mail/adgangskode til. Det er nemmest at slå **Confirm email** fra (du er eneste bruger); ellers skal du sætte **Authentication → URL Configuration → Site URL** til Pages-adressen, så bekræftelseslinket virker.
3. I appen: **Indstillinger → Opret konto**, og derefter **Log ind** på hver enhed.

Projektets URL og anon-nøgle står i [`src/config.ts`](src/config.ts). Anon-nøglen er offentlig af design (den ender i browseren); sikkerheden kommer fra RLS-politikkerne. Brug aldrig `service_role`-nøglen i appen.

Uden login virker alt stadig. Brug **Indstillinger → Eksportér (JSON)** som backup, og **Importér** for at flytte data.

## Arkitektur

```text
content/                   indhold (se CONTENT_GUIDE.md)
scripts/
  import-sources.ts        kildefiler → kursusmapper, videos.yaml fra handoffs
  build-content.ts         validering + Markdown → HTML (KaTeX, mhchem, Mermaid, ::interactive) → public/data/*.json
  lib/plan-parser.ts       parser for planformatet
  lib/markdown.ts          unified/remark/rehype-pipeline
src/
  lib/storage/             StorageAdapter, Dexie (IndexedDB), eksport/import, Supabase-sync
  lib/mastery.ts           mestringsmodellen (dokumenteret i filen)
  lib/srs.ts               spaced repetition (SM-2-variant, dokumenteret i filen)
  lib/training.ts          uendelig træningssession med adaptiv sværhedsgrad
  lib/weakness.ts          svaghedsfinderen ("Træn mere på" med begrundelser)
  lib/progress.ts          fremskridt, "næste skridt", kursusgennemførelse
  lib/generators.ts        generator-registrering (import.meta.glob) og hjælpere
  lib/interactives.ts      komponent-registrering (lazy)
  lib/runners/             CodeRunner-interface + Python via Pyodide i en Web Worker
  pages/, components/      React-UI (dansk)
tests/unit, tests/e2e      Vitest og Playwright
```

**Stak:** Vite + React 18 + TypeScript (strict), react-router (HashRouter), Tailwind CSS, Dexie, KaTeX (bygget på forhånd), Mermaid (lazy), Pyodide (selv-hostet, lazy), Supabase (lazy).

**Privatliv:** ingen analytics, ingen trackere, ingen eksterne skrifttyper. YouTube indlejres via `youtube-nocookie.com`, og først når du trykker afspil. Python kører lokalt i browseren; kun ekstra pakker som numpy hentes fra Pyodides CDN, når en kodeblok bruger dem.

### Modellerne kort

- **Mestring** pr. emne og uge: eksponentielt vægtet gennemsnit af scorer (auto-tjek 0/1; selvvurdering 0 / 0,33 / 0,66 / 1), hvor sværere øvelser vægter mere (★ 0,8, ★★ 1,0, ★★★ 1,25), glemsel med en halveringstid, der vokser med antal forsøg (10·(1 + n/4) dage), og en sikkerhed på 1 − e^(−n/4).
- **Repetition:** SM-2-variant. Kunne ikke → 1 dag og lavere "ease"; ellers 1–2 → 2–4 → interval × ease dage.
- **Træning:** blander øvelser, der er klar til repetition (40 %), nye genererede opgaver (45 %) og nye øvelser fra planerne (15 %). Sværhedsgraden går op efter 3 rigtige i træk og ned efter 2 fejl.
- **Svaghedsfinderen:** rangerer emner i de uger, du er nået til, efter (1 − mestring), vægtet med sikkerhed, og begrunder fx "3 af de sidste 5 forkert", "ikke øvet i 21 dage" og "★★-øvelser under 50 %".
- **Kursus gennemført:** alle checkpoints er afkrydset, eller mestring ≥ 0,7 i alle kursets emner. Så anbefales kurserne i `next:`.

## Valg og begrænsninger

- **Foundations-videoer:** handoff'en har kun URL'er til 7 af 91 videoer. Resten vises som "Video mangler, indsæt URL" med en færdig YouTube-søgning. Indsæt URL'en på ugesiden (gemmes for dig), eller skriv ID'et i `content/courses/foundations/videos.yaml` (gælder for alle).
- **Python i browseren:** alle 101 selvstændige Python-blokke i planerne er afprøvet i Pyodide. 7 blokke bygger på anden kode: 5 numpy-varianter (kør dem med **Kør med koden ovenfor**; numpy hentes første gang), og løsning 9.12 og 11.11 i Foundations, der importerer kode fra en tidligere løsning (kopiér den ind i dit eget svarfelt).
- **Lean** køres ikke i browseren. Lean-blokke har et link til den officielle Lean 4-editor.
- **Auto-tjek:** de fleste øvelser i planerne er beviser eller åbne spørgsmål og vurderes af dig selv. Generatorerne har altid auto-tjek.
- **Synkronisering** fletter post for post. Redigerer du det samme svar på to enheder uden at synkronisere imellem, vinder den seneste ændring.
- Interaktive komponenter er placeret via `overrides.yaml`, så `plan.md` forbliver uændret og kan importeres igen.
