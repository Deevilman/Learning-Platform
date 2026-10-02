# CLOUD HANDOFF: YouTube playlist "Foundations of Mathematics" (v2)

> **Kort på dansk (til Oliver):** Denne fil er opgavebeskrivelsen til en cloud-agent med browseradgang til din YouTube-konto (fx Claude i skyen eller ChatGPT Work/Cloud Browser). Agenten bygger (eller opdaterer) playlisten, så den følger **ugerækkefølgen i `Foundations_of_Mathematics_Laeringsplan.md`**, inklusive de videoer, der blev tilføjet i læringsplanen. Giv agenten hele filen. Resten er på engelsk, fordi agenten skal søge på engelske titler.

---

## 0. Who this is for

You are a cloud agent with a browser that is signed in to the user's YouTube account. Your job is to build one ordered YouTube playlist. This document supersedes the earlier PDF handoff (`Foundations_of_Mathematics_YouTube_Work_Handoff.pdf`, "v1"). The main changes:

- **Week order.** The playlist now follows the 14-week order of the companion learning plan, not the source order of v1.
- **Exact titles.** Exact titles are given wherever they were verified on 2026-09-22 and 2026-10-01.
- **Four added items:** Computerphile *Lambda Calculus*, Milewski *Category Theory 6.1: Functors*, and optionally Sipser L1 and L10.
- **One optional search slot** for week 9, which has no video in v1.

## 1. Primary task

**Playlist name:** `Foundations of Mathematics - Logic to Sets to Goedel`
**Visibility:** Private, unless the user has told you otherwise.
**Description:** paste the text in section 6.

**Steps**

1. Check whether a playlist with this name already exists on the account.
   - **If it exists (v1):** keep it. Add the missing items from section 4 and reorder everything into the order of section 4. YouTube's playlist editor supports drag and drop, and YouTube Studio under Content → Playlists works as well. If reordering 60+ items turns out to be impractical, create a **new** playlist instead, named `Foundations of Mathematics - Logic to Sets to Goedel (uge-orden)`. Leave the old one untouched and say so in the report.
   - **If it does not exist:** create it.
2. Search for each item in section 4 **using both the title and the channel**. Verify the uploader before adding. Section 3 lists the expected channels.
3. Add the items in the exact order of section 4. "Optional" items are added too, unless the item says otherwise. The learning plan marks them as optional for the learner.
4. Do **not** add duplicates, Shorts, reaction videos, reuploads on unofficial channels, or low-quality summaries.
5. If an exact video has disappeared, substitute a high-quality equivalent from the same institution or channel. If that is impossible, use the quality rules in section 5, and **record every substitution**.
6. Review the finished playlist once from top to bottom against section 4.
7. Report as described in section 7.

**Do not:** like, comment, subscribe, change account or privacy settings, or accept optional cookies. Decline non-essential cookies if a consent banner appears. Do not delete anything except duplicates you created yourself.

## 2. Context: the learner and the companion plan

The learner is a Danish HTX student with a strong interest in mathematics, programming and computer science. The companion file `Foundations_of_Mathematics_Laeringsplan.md` is a 14-week Danish study plan that refers to the videos by the keys **P1–P14**. The keys used in section 4 match it. The goal is to understand the chain:

**logic → axioms → sets → number systems → formal theories → computation → undecidability → incompleteness**, followed by type theory and category theory as alternative foundations.

## 3. Sources and expected uploaders

| Key | Source | Expected channel / uploader |
|---|---|---|
| P1 | *Start Learning Mathematics* (Logic, Sets, Numbers, Reals, Complex) | **The Bright Side of Mathematics** |
| P2 | MIT 6.042J *Mathematics for Computer Science*, **Spring 2015**. Short videos with titles like `1.3.1 Well Ordering Principle 1: Video` | **MIT OpenCourseWare** |
| P3 | Discrete-math proof videos, e.g. `[Discrete Mathematics] Direct Proofs Examples` | **TrevTutor** |
| P4–P5 | Robin Knight, 3rd-year Set Theory course | **Oxford Mathematics** |
| P6 | Concise ZFC axioms overview | see item 8.3 (no fixed channel; quality rules apply) |
| P7 | MIT 18.404J *Theory of Computation*, **Fall 2020**, Michael Sipser | **MIT OpenCourseWare** |
| P8 | *Gödel's Incompleteness Theorem - Numberphile* (Marcus du Sautoy) | **Numberphile** |
| P9 | *Godel's 1st Incompleteness Theorem - Proof by Diagonalization* | as found, see item 12.3 |
| P10 | Joel David Hamkins, *The Gödel incompleteness phenomenon* | Hamkins's own upload, or the hosting institution |
| P11 | *Peter Dybjer: Intuitionistic Type Theory (Lecture I)* | **Hausdorff Center for Mathematics** (Trimester Program "Types, Sets and Constructions") |
| P12 | Philip Wadler, *Propositions as Types* | **Strange Loop Conference** |
| P13 | One introductory Homotopy Type Theory lecture (optional) | university or HoTT summer-school channel |
| P14 | Bartosz Milewski, *Category Theory* lecture series | **Bartosz Milewski** |
| A1–A4 | Added items, see section 4 | Computerphile, Bartosz Milewski, MIT OCW |

## 4. Ordered playlist contents (in week order)

Search with the **quoted title plus the channel name**. For MIT 6.042J, YouTube titles usually end in `: Video`, e.g. `1.4.4 Truth Tables: Video`. For P1, the part names below come from the course website (thebrightsideofmathematics.com), but the exact YouTube title format may differ, e.g. `Start Learning Logic | Part 1`. Search for `Bright Side of Mathematics Start Learning Logic Part 1` and match by part number and topic.

### Week 1: Propositional logic
1.1 P1: `Start Learning Logic | Part 1` (*Logical Statements, Negations and Conjunction*)
1.2 P1: `Start Learning Logic | Part 2` (*Disjunction, Tautology and Logical Equivalence*)
1.3 P1: `Start Learning Logic | Part 3` (*Conditional, Biconditional, Implication and Deduction Rules*)
1.4 P2: `1.4.1 Propositional Operators`
1.5 P2: `1.4.4 Truth Tables`
1.6 P2: `1.4.6 Implies`
1.7 P2: `1.4.7 Propositional Logic`
1.8 P2 (optional): `1.4.3 Digital Logic`

### Week 2: Quantifiers and proof methods
2.1 P2: `1.1.2 Intro To Proofs: Part 1`
2.2 P2: `1.1.3 Intro to Proofs: Part 2`
2.3 P2: `1.2.1 Proof By Contradiction`
2.4 P2: `1.2.3 Proof By Cases`
2.5 P2: `1.5.1 Predicate Logic 1`
2.6 P2: `1.5.2 Predicate Logic 2`
2.7 P2: `1.5.4 Predicate Logic 3`
2.8 P3: TrevTutor direct-proof lesson (`[Discrete Mathematics] Direct Proofs Examples` or the matching *Direct Proofs* lecture)
2.9 P3 (optional): one TrevTutor video on proof by contraposition and one on proof by contradiction, from the same series

### Week 3: Induction and recursive definitions
3.1 P2: `1.3.1 Well Ordering Principle 1`
3.2 P2: `1.3.3 Well Ordering Principle 2`
3.3 P2: `1.3.5 Well Ordering Principle 3`
3.4 P2: `1.8.1 Induction`
3.5 P2: `1.8.2 Bogus Induction`
3.6 P2: `1.8.4 Strong Induction`
3.7 P2 (optional): `1.8.6 WOP vs Induction`
3.8 P2: `1.10.1 Recursive Data`
3.9 P2: `1.10.4 Structural Induction`
3.10 P2 (optional): `1.10.7 Recursive Functions`

### Week 4: Sets, relations and functions
4.1–4.7 P1: `Start Learning Sets`, Parts 1–7 in order: *Overview and Element Relation*; *Predicates, Equality and Subsets*; *Union, Intersection, Differences and Power Set*; *Cartesian Product and Maps*; *Range, Image and Preimage*; *Injectivity, Surjectivity and Bijectivity*; *Composition of Maps*. Use the official *Start Learning Sets* playlist from the channel if there is one.
4.8 P2: `1.6.1 Sets Definitions`
4.9 P2: `1.6.2 Sets Operations`
4.10 P2: `1.7.1 Relations`
4.11 P2: `1.7.3 Relational Mappings`
4.12 P2 (optional): `1.7.5 Finite Cardinality`

### Week 5: Constructing the natural numbers
5.1–5.5 P1: `Start Learning Numbers`, Parts 1–5: *Natural Numbers (in Set Theory)*; *Natural Numbers (Successor Map and Addition)*; *Natural Numbers (Induction and Associativity)*; *Natural Numbers (Ordering)*; *Natural Numbers (Multiplication)*

### Week 6: Integers, rationals, reals (and complex numbers)
6.1–6.6 P1: `Start Learning Numbers`, Parts 6–11: *Integers (Construction)*; *Integers (Addition and Inverses)*; *Integers (Multiplication)*; *Rational Numbers (Construction)*; *Rational Numbers (Addition and Multiplication)*; *Rational Numbers (Ordering)*
6.7–6.10 P1: `Start Learning Reals`, Parts 1–4: *Cauchy Sequences*; *Completeness Axiom*; *Working With Axioms*; *Construction*
6.11–6.12 P1: `Start Learning Complex`, Parts 1–2: *Introduction*; *Definition* (Part 3 is optional)

### Week 7: Infinity
7.1 P2: `1.11.1 Cardinality`
7.2 P2: `1.11.3 Countable Sets`
7.3 P2: `1.11.4 Cantor's Theorem`

### Week 8: Axiomatic set theory (ZFC)
8.1 P4: `Set Theory - What is Set Theory and what is it for? Oxford Mathematics 3rd Year Student Lecture` (Oxford Mathematics)
8.2 P5: `Set Theory - Russell's Paradox: Oxford Mathematics 3rd Year Student Lecture` (Oxford Mathematics). Add it **directly after 8.1**.
8.3 P6: a concise, mathematically careful overview of the ZFC axioms. Search `10 Axioms in 10 Minutes ZFC Set Theory`. If no video by that name exists (it was not found on 2026-10-01), use **`Set Theory - The first few axioms: Oxford Mathematics 3rd Year Student Lecture`** (the next lecture in the same Oxford series). Otherwise use another careful ZFC-axioms lecture that covers all of Extensionality, Pairing, Union, Power Set, Separation, Replacement, Infinity, Foundation and Choice. Record which video you chose.
8.4 P2 (optional): `1.11.9 Russell's Paradox`

### Week 9: Formal systems, syntax vs. semantics (optional slot, no v1 video)
9.1 **Optional search slot.** Search for **one** university-level lecture (≥ 30 min, by a university channel or a recognized logician) on *first-order logic: syntax vs. semantics, models, soundness and Gödel's completeness theorem*. Suggested searches: `first-order logic syntax semantics lecture`, `Gödel completeness theorem lecture`. Add it **only if** it clearly meets the quality rules in section 5. Otherwise skip the slot and say so in the report. The learning plan covers this week fully in text.

### Week 10: Computability
10.1 A1 (optional): MIT 18.404J **L1** `Introduction, Finite Automata, Regular Expressions` (Sipser, MIT OCW)
10.2 A2: `Lambda Calculus - Computerphile` (Graham Hutton). Verified URL: https://www.youtube.com/watch?v=eis11j_iGMs
10.3 P7: MIT 18.404J **L5** `CF Pumping Lemma, Turing Machines`
10.4 P7: MIT 18.404J **L6** `TM Variants, Church-Turing Thesis`
10.5 P7: MIT 18.404J **L7** `Decision Problems for Automata and Grammars`

### Week 11: Undecidability
11.1 P7: MIT 18.404J **L8** `Undecidability`
11.2 P7: MIT 18.404J **L9** `Reducibility`
11.3 A3 (optional): MIT 18.404J **L10** `Computation History Method`
11.4 P2 (optional): `1.11.7 The Halting Problem`

### Week 12: Gödel's incompleteness theorems
12.1 P7: MIT 18.404J **L11** `Recursion Theorem and Logic`
12.2 P8: `Gödel's Incompleteness Theorem - Numberphile`. Verified URL: https://www.youtube.com/watch?v=O4ndIDcDSGc
12.3 P9: `Godel's 1st Incompleteness Theorem - Proof by Diagonalization`. Verified URL: https://www.youtube.com/watch?v=PpSxqde0af4
12.4 P10: `The Gödel incompleteness phenomenon` (Joel David Hamkins). Verified URL: https://www.youtube.com/watch?v=Y5trjR5aw0k

### Week 13: Type theory and Curry–Howard
13.1 P11: `Peter Dybjer: Intuitionistic Type Theory (Lecture I)`. Verified URL: https://www.youtube.com/watch?v=5V-qka70DAE. If Lecture II from the same series is on the same channel and still introductory, add it directly after.
13.2 P12: Philip Wadler, `Propositions as Types` (Strange Loop Conference)
13.3 P13 (optional, advanced): one introductory Homotopy Type Theory lecture, e.g. from the HoTT Summer School 2022 playlist or an introduction by Andrej Bauer, Steve Awodey or Emily Riehl. It must come **after** 13.1–13.2.

### Week 14: Category theory
14.1 P14: `Category Theory 1.1: Motivation and Philosophy`
14.2 P14: `Category Theory 1.2: What is a category?`
14.3 P14: `Category Theory 2.1: Functions, epimorphisms`
14.4 P14: `Category Theory 2.2: Monomorphisms, simple types`
14.5 P14: `Category Theory 3.1: Examples of categories, orders, monoids`
14.6 P14 (optional): `Category Theory 3.2: Kleisli category`
14.7 A4: `Category Theory 6.1: Functors`. Verified URL: https://www.youtube.com/watch?v=FyoQjkwsy7o

All P14 and A4 videos are on the **Bartosz Milewski** channel (playlist *Category Theory*: https://www.youtube.com/playlist?list=PLbgaMIhjbmEnaH_LTkxLI7FMa2HsnawM_). Do **not** add the whole 20-video series.

The expected total is roughly 75–85 videos, depending on the optional items and how P1 parts are split.

## 5. Quality rules for substitutions

- **Source priority:** MIT OpenCourseWare, then Oxford and other universities, then recognized researchers and lecturers, then strong specialist educators.
- Prefer lectures with definitions, equations, proofs and worked examples.
- Avoid "mind-blowing math facts" videos without formal content, and avoid reuploads on unofficial channels.
- English is preferred. Danish is acceptable only if equal or better in rigor.
- For Gödel material, prefer content that clearly distinguishes truth, provability, consistency, completeness and effective axiomatizability.
- Never place an advanced Gödel, type theory or category theory lecture before its prerequisites.

## 6. Playlist description (paste as-is)

```text
Ordered 14-week path: logic → proof → induction → sets/functions → construction of numbers → infinity → ZFC → formal systems → Turing machines → undecidability → Gödel → type theory → category theory.
Companion study plan (Danish): Foundations_of_Mathematics_Laeringsplan.md (keys P1–P14).
Uge 1 logik · 2 bevis · 3 induktion · 4 mængder · 5 ℕ · 6 ℤ ℚ ℝ ℂ · 7 uendelighed · 8 ZFC · 9 formelle systemer · 10 beregnelighed · 11 uafgørlighed · 12 Gödel · 13 typeteori · 14 kategoriteori.
```

## 7. Final check and report

Before finishing, verify that the order follows:

**Logic → proof → induction → sets/functions → construction of numbers → infinity → ZFC → (formal systems) → Turing machines → undecidability → Gödel → type theory → category theory**

Then report:

1. The playlist name and URL, and whether it was newly created or an existing one was updated.
2. The total number of videos.
3. Every substitution, with the requested item → the chosen video, the channel and the reason.
4. Items that could not be found and were skipped, including the week 9 slot if it was skipped.
5. Whether the top-to-bottom order check passed.

---

*Prepared 2026-10-01 as a companion to `Foundations_of_Mathematics_Laeringsplan.md`. Verify current availability and uploader identity at execution time.*
