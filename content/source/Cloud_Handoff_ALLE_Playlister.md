# CLOUD HANDOFF — ALLE PLAYLISTER (Foundations · Quant · Hedge Funds)

> **Kort på dansk (til Oliver):** Denne fil samler de tre handoffs, så en cloud-agent kan bygge alle tre playlister i én kørsel. Hvert afsnit står for sig selv og kan også gives til agenten alene: `Foundations_of_Mathematics_Cloud_Handoff.md`, `Quant_Trading_Research_Cloud_Handoff.md` og `Hedge_Fund_Cloud_Handoff.md`.

## Instructions for the agent

Build the three playlists **one at a time, in this order**:

1. **Foundations of Mathematics** (Part 1)
2. **Quant Trading & Research** (Part 2)
3. **Hedge Funds** (Part 3)

For each part, follow that part's own sections 1–7, and finish its report before you start the next part.

At the end, give one combined summary covering all three playlists: the playlist names and URLs, the number of videos in each, every substitution you made, which search slots were filled and which were skipped, and whether each order check passed.

The rules for all three playlists:

- Make each playlist private.
- Do not like, comment or subscribe.
- Do not change any account settings.
- Decline all non-essential cookies.
- Do not delete anything except duplicates you created yourself.

Some videos appear in more than one playlist, for example the Jim Simons TED talk and MIT 18.S096 L7. That is intentional: add them to each playlist where they are listed.


---

# Part 1 — CLOUD HANDOFF: YouTube playlist "Foundations of Mathematics" (v2)

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

---

# Part 2 — CLOUD HANDOFF: YouTube playlist "Quant Trading & Research"

> **Kort på dansk (til Oliver):** Denne fil er opgavebeskrivelsen til en cloud-agent med browseradgang til din YouTube-konto. Agenten bygger playlisten, så den følger ugerne i `Quant_Trading_Research_Laeringsplan.md`. Hver video er angivet med præcis titel, kanal og URL. Alle blev tjekket 2026-10-01 via YouTubes oEmbed. Giv agenten hele filen. Resten er på engelsk.

---

## 0. Who this is for

You are a cloud agent with a browser that is signed in to the user's YouTube account. Your job is to build **one** ordered YouTube playlist from the list in section 4. Every item has a verified URL, so normally you can open the URL directly. You only need to search when a URL no longer works, or when an item is a **search slot**.

## 1. Primary task

**Playlist name:** `Quant Trading & Research - Markets to Models to Strategies`
**Visibility:** Private, unless the user has told you otherwise.
**Description:** paste the text in section 6.

**Steps**

1. If a playlist with this name already exists, reuse it: add the missing items and fix the order. Otherwise create it.
2. For each item in section 4, open the URL. Check that the **title and channel match** (minor title edits by the uploader are fine), then add the video to the playlist.
3. Keep the **exact order** of section 4. Items marked *(optional)* are added too. They are optional for the learner, not for you.
4. **Search slots** (marked 🔎) are added **only if** a video clearly meets the quality rules in section 5. If none does, skip the slot and say so in the report.
5. Do **not** add duplicates, Shorts, reaction videos, reuploads on unofficial channels, "get rich"/signal-seller/influencer content, or anything that sells a course or trading service.
6. If a URL is dead, search for `"<exact title>" <channel>`. Use the same video re-uploaded **by the same channel**, or else the closest equivalent from the same course or institution. **Record every substitution.**
7. Review the playlist once from top to bottom against section 4.
8. Report as described in section 7.

**Do not:** like, comment, subscribe, change account or privacy settings, or accept optional cookies. Decline non-essential cookies if a consent banner appears. Do not delete anything except duplicates you created yourself.

**Verification tip:** `https://www.youtube.com/oembed?format=json&url=<video URL>` returns the exact title and channel without a consent page.

## 2. Context

The learner is a Danish HTX student who is strong in math and Python and has just completed a rigorous Foundations of Mathematics plan. The companion file `Quant_Trading_Research_Laeringsplan.md` is a 16-week Danish study plan that refers to the videos by the keys **Q1.1 … Q16.7** used below. The arc runs:

**markets → probability → statistics → linear algebra/regression → portfolios & factors → time series → research methodology/backtesting → strategies → stochastic calculus → derivatives → microstructure → risk & ML → research project.**

The material is educational. It is not investment advice.

## 3. Main sources

| Source | Channel |
|---|---|
| MIT 18.S096 *Topics in Mathematics with Applications in Finance* (Fall 2013). Playlist: https://www.youtube.com/playlist?list=PLUl4u3cNGP63ctJIEC1UnZ0btsphnnoHR | MIT OpenCourseWare |
| MIT 15.401 *Finance Theory I* (Fall 2008, Andrew Lo). Playlist: https://www.youtube.com/playlist?list=PLUl4u3cNGP63B2lDhyKOsImI7FjCf6eDW | MIT OpenCourseWare |
| Harvard *Statistics 110: Probability* (Joe Blitzstein). Playlist: https://www.youtube.com/playlist?list=PL2SOU6wwxB0uwwH80KTQ6ht66KWxbzTIo | Harvard University |
| MIT 18.650 *Statistics for Applications* (Fall 2016). Playlist: https://www.youtube.com/playlist?list=PLUl4u3cNGP60uVBMaoNERc6knT_MgPKS0 | MIT OpenCourseWare |
| MIT 18.06 *Linear Algebra* (Strang): selected lectures | MIT OpenCourseWare |
| Yale ECON 252 *Financial Markets* (Shiller). 2011 playlist: https://www.youtube.com/playlist?list=PL8FB14A2200B87185 · 2008 playlist: https://www.youtube.com/playlist?list=PL8F7E2591EE283A2E | YaleCourses |
| Quantopian Lecture Series and QuantCon talks | Quantopian |
| *Time Series Talk* | ritvikmath |
| *AHL Explains*. Playlist: https://www.youtube.com/playlist?list=PLwmBa3RpZcUrebD4o1TNt3d9wplBktmdS | Man AHL |
| University of Copenhagen, *Financial Markets Microstructure* (Egor Starkov, 2020). Playlist: https://www.youtube.com/playlist?list=PL4pUs4P_j1Wa2_P1lw44kFWWjKDTGUY7S | economification |

Do **not** use the third-party playlist `PL88E6E5D45B6CD41A` (an unofficial copy of Yale ECON 252).

## 4. Ordered playlist contents (by week)

### Week 1: Markets, instruments and quant roles
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q1.1 | 1. Introduction, Financial Terms and Concepts | MIT OpenCourseWare | https://www.youtube.com/watch?v=wvXDB9dMdEo |
| Q1.2 | 21. Exchanges, Brokers, Dealers, Clearinghouses | YaleCourses | https://www.youtube.com/watch?v=kAl8DezwLAE |
| Q1.3 | 6. Efficient Markets vs. Excess Volatility | YaleCourses | https://www.youtube.com/watch?v=pXJb29s3nmY |
| Q1.4 | The mathematician who cracked Wall Street \| Jim Simons | TED | https://www.youtube.com/watch?v=U5kIdtMJGc8 |
| Q1.5 *(optional)* | Ses 2: Present Value Relations I | MIT OpenCourseWare | https://www.youtube.com/watch?v=U03Md5enU-0 |

### Week 2: Returns, risk and Python
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q2.1 *(optional)* | Ses 12: Options III & Risk and Return I | MIT OpenCourseWare | https://www.youtube.com/watch?v=Q2qjnLO3I_M |
| Q2.2 | Ses 13: Risk and Return II & Portfolio Theory I | MIT OpenCourseWare | https://www.youtube.com/watch?v=tL7Lcl90Sc0 |
| Q2.3 *(optional)* | Quantopian Lecture Series: Introduction to Python | Quantopian | https://www.youtube.com/watch?v=bQUWLkKzpxE |
| Q2.4 *(optional)* | Algorithmic Trading Using Python - Full Course | freeCodeCamp.org | https://www.youtube.com/watch?v=xfzGZB4HhEE |

### Week 3: Probability I
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q3.1 | Lecture 4: Conditional Probability \| Statistics 110 | Harvard University | https://www.youtube.com/watch?v=P7NE4WF8j-Q |
| Q3.2 *(optional)* | Lecture 5: Conditioning Continued, Law of Total Probability \| Statistics 110 | Harvard University | https://www.youtube.com/watch?v=JzDvVgNDxo8 |
| Q3.3 | Lecture 7: Gambler's Ruin and Random Variables \| Statistics 110 | Harvard University | https://www.youtube.com/watch?v=PNrqCdslGi4 |
| Q3.4 *(optional)* | Lecture 8: Random Variables and Their Distributions \| Statistics 110 | Harvard University | https://www.youtube.com/watch?v=k2BB0p8byGA |
| Q3.5 | Lecture 9: Expectation, Indicator Random Variables, Linearity \| Statistics 110 | Harvard University | https://www.youtube.com/watch?v=LX2q356N2rU |

### Week 4: Probability II
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q4.1 | Lecture 13: Normal distribution \| Statistics 110 | Harvard University | https://www.youtube.com/watch?v=72QjzHnYvL0 |
| Q4.2 *(optional)* | Lecture 19: Joint, Conditional, and Marginal Distributions \| Statistics 110 | Harvard University | https://www.youtube.com/watch?v=J70dP_AECzQ |
| Q4.3 | Lecture 21: Covariance and Correlation \| Statistics 110 | Harvard University | https://www.youtube.com/watch?v=IujCYxtpszU |
| Q4.4 | Lecture 29: Law of Large Numbers and Central Limit Theorem \| Statistics 110 | Harvard University | https://www.youtube.com/watch?v=OprNqnHsVIA |
| Q4.5 *(optional)* | Lecture 31: Markov Chains \| Statistics 110 | Harvard University | https://www.youtube.com/watch?v=8AJPs3gvNlY |
| Q4.6 *(optional)* | 3. Probability Theory | MIT OpenCourseWare | https://www.youtube.com/watch?v=f9XFM8YLccg |

### Week 5: Statistics and inference
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q5.1 | 4. Parametric Inference (cont.) and Maximum Likelihood Estimation | MIT OpenCourseWare | https://www.youtube.com/watch?v=rLlZpnT02ZU |
| Q5.2 | 7. Parametric Hypothesis Testing | MIT OpenCourseWare | https://www.youtube.com/watch?v=phbw9r1iUDI |
| Q5.3 *(optional)* | 8. Parametric Hypothesis Testing (cont.) | MIT OpenCourseWare | https://www.youtube.com/watch?v=4HRhg4eUiMo |
| Q5.4 | Quantopian Lecture Series: p-Hacking and Multiple Comparisons Bias | Quantopian | https://www.youtube.com/watch?v=YiDfbYtgUPc |

### Week 6: Linear algebra, regression and PCA
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q6.1 | 15. Projections onto Subspaces | MIT OpenCourseWare | https://www.youtube.com/watch?v=Y_Ac6KiQ1t0 |
| Q6.2 | 16. Projection Matrices and Least Squares | MIT OpenCourseWare | https://www.youtube.com/watch?v=osh80YCg_GM |
| Q6.3 | 13. Regression | MIT OpenCourseWare | https://www.youtube.com/watch?v=yP1S37BiEsQ |
| Q6.4 *(optional)* | 21. Eigenvalues and Eigenvectors | MIT OpenCourseWare | https://www.youtube.com/watch?v=cdZnhQjJu4I |
| Q6.5 *(optional)* | 25. Symmetric Matrices and Positive Definiteness | MIT OpenCourseWare | https://www.youtube.com/watch?v=UCc9q_cAhho |
| Q6.6 *(optional)* | 6. Regression Analysis | MIT OpenCourseWare | https://www.youtube.com/watch?v=l1kLCrxL9Hk |

### Week 7: Portfolio theory and CAPM
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q7.1 | Ses 14: Portfolio Theory II | MIT OpenCourseWare | https://www.youtube.com/watch?v=J7d3vcaS9-o |
| Q7.2 | Ses 15: Portfolio Theory III & The CAPM and APT I | MIT OpenCourseWare | https://www.youtube.com/watch?v=z2oQe6B1Qa4 |
| Q7.3 *(optional)* | Ses 16: The CAPM and APT II | MIT OpenCourseWare | https://www.youtube.com/watch?v=N8gtnbJuMoo |
| Q7.4 *(optional)* | 14. Portfolio Theory | MIT OpenCourseWare | https://www.youtube.com/watch?v=ywl3pq6yc54 |

### Week 8: Factor models
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q8.1 | Should You Be Factor Investing? | Ben Felix | https://www.youtube.com/watch?v=ViTnIebSzj4 |
| Q8.2 | Quantopian Lecture Series: Risk Factor Expsosure *(the typo is in the official title)* | Quantopian | https://www.youtube.com/watch?v=Ep8Y5JfQoRg |
| Q8.3 | Quantopian Lecture Series: Fundamental Factor Models | Quantopian | https://www.youtube.com/watch?v=P16zDtf0CE0 |
| Q8.4 *(optional)* | 19. Principal Component Analysis | MIT OpenCourseWare | https://www.youtube.com/watch?v=WW3ZJHPwvyg |
| Q8.5 *(optional)* | 15. Factor Modeling | MIT OpenCourseWare | https://www.youtube.com/watch?v=ro07evEWbCE |

### Week 9: Time series
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q9.1 | Time Series Talk : Stationarity | ritvikmath | https://www.youtube.com/watch?v=oY-j2Wof51c |
| Q9.2 | Time Series Talk : Autocorrelation and Partial Autocorrelation | ritvikmath | https://www.youtube.com/watch?v=DeORzP0go5I |
| Q9.3 | Time Series Talk : Autoregressive Model | ritvikmath | https://www.youtube.com/watch?v=5-2C4eO4cPQ |
| Q9.4 | Time Series Talk : Moving Average Model | ritvikmath | https://www.youtube.com/watch?v=voryLhxiPzE |
| Q9.5 | 8. Time Series Analysis I | MIT OpenCourseWare | https://www.youtube.com/watch?v=uBeM1FUk4Ps |
| Q9.6 | Time Series Talk : ARCH Model | ritvikmath | https://www.youtube.com/watch?v=Li95a2biFCU |
| Q9.7 | GARCH Model : Time Series Talk | ritvikmath | https://www.youtube.com/watch?v=inoBpq1UEn4 |
| Q9.8 *(optional)* | 9. Volatility Modeling | MIT OpenCourseWare | https://www.youtube.com/watch?v=cDlbEQz1PQk |
| Q9.9 | Integration, Cointegration, and Stationarity | Quantopian | https://www.youtube.com/watch?v=Pn_RiDbK82M |
| Q9.10 | Cointegration - an introduction | Ben Lambert | https://www.youtube.com/watch?v=vvTKjm94Ars |

### Week 10: Backtesting and research methodology
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q10.1 | The 7 Reasons Most Machine Learning Funds Fail Marcos Lopez de Prado from QuantCon 2018 | Quantopian | https://www.youtube.com/watch?v=BRUlSm4gdQ4 |
| Q10.2 | Quantopian Lecture Series: Overfitting | Quantopian | https://www.youtube.com/watch?v=KNCgvjyKrcw |
| Q10.3 | The Deflated Sharpe Ratio | Advances in Financial Machine Learning | https://www.youtube.com/watch?v=jPI1oo_Ss5U |
| Q10.4 | Enhancing Statistical Significance of Backtests by Dr. Ernest Chan at QuantCon 2017 | Quantopian | https://www.youtube.com/watch?v=OxNcA6RO_ZE |
| Q10.5 *(optional)* | Ses 19: Efficient Markets II | MIT OpenCourseWare | https://www.youtube.com/watch?v=a5PF2PcElV0 |

### Week 11: Momentum, mean reversion and statistical arbitrage
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q11.1 | AHL Explains - Momentum | Man AHL | https://www.youtube.com/watch?v=D_WhInJePC8 |
| Q11.2 | AHL Explains - Cross Sectional Momentum | Man AHL | https://www.youtube.com/watch?v=tfNI6YwDG_o |
| Q11.3 | Introduction to Pairs Trading | Quantopian | https://www.youtube.com/watch?v=JTucMRYMOyY |
| Q11.4 *(optional)* | Mean Reversion Strategy with Ernest Chan \| Cointegration, Stationarity & Bollinger Bands Explained | Quantra | https://www.youtube.com/watch?v=mopIwlSqkc0 |
| Q11.5 *(optional)* | 12. Time Series Analysis III | MIT OpenCourseWare | https://www.youtube.com/watch?v=9G1IDAqrWkg |

### Week 12: Carry, value, trend and portfolio construction
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q12.1a | AHL Explains - Volatility Scaling | Man AHL | find it in the *AHL Explains* playlist (section 3) |
| Q12.1b | AHL Explains - Signal Diversification | Man AHL | find it in the *AHL Explains* playlist (section 3) |
| Q12.2 | Cliff Asness on Factor Investing and the History of Financial Economics \| Capitalism and Freedom | Hoover Institution | https://www.youtube.com/watch?v=2QrPCewZO9E |
| Q12.3 | 16. Portfolio Management | MIT OpenCourseWare | https://www.youtube.com/watch?v=8TJQhQ2GZ0Y |
| Q12.4 *(optional)* | Trading Strategies Deep Dive with Rob Carver and Alan Dunne \| Systematic Investor 266 | Top Traders Unplugged | https://www.youtube.com/watch?v=pVE8sehGzCQ |
| Q12.5 *(optional)* | Causal Factor Investing | Advances in Financial Machine Learning | https://www.youtube.com/watch?v=1J5GKfcedE0 |

### Week 13: Stochastic calculus
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q13.1 | 5. Stochastic Processes I | MIT OpenCourseWare | https://www.youtube.com/watch?v=TuTmC8aOQJE |
| Q13.2 | 17. Stochastic Processes II | MIT OpenCourseWare | https://www.youtube.com/watch?v=PPl-7_RL0Ko |
| Q13.3 | 18. Itō Calculus | MIT OpenCourseWare | https://www.youtube.com/watch?v=Z5yRMMVUC5w |
| Q13.4 *(optional)* | 21. Stochastic Differential Equations | MIT OpenCourseWare | https://www.youtube.com/watch?v=qdbkvD4N-us |

### Week 14: Derivatives and Black–Scholes
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q14.1 *(optional)* | Ses 10: Forward and Futures Contracts II & Options I | MIT OpenCourseWare | https://www.youtube.com/watch?v=IwA7nVEwqto |
| Q14.2 | Ses 11: Options II | MIT OpenCourseWare | https://www.youtube.com/watch?v=rMsu4v-UlkA |
| Q14.3 | Introduction to the Black-Scholes formula \| Finance & Capital Markets \| Khan Academy | Khan Academy | https://www.youtube.com/watch?v=pr-u4LCFYEY |
| Q14.4 | 19. Black-Scholes Formula, Risk-neutral Valuation | MIT OpenCourseWare | https://www.youtube.com/watch?v=TnS8kI_KuJc |
| Q14.5 | Implied volatility \| Finance & Capital Markets \| Khan Academy | Khan Academy | https://www.youtube.com/watch?v=VIHldsSmASU |
| Q14.6 *(optional)* | 17. Options Markets | YaleCourses | https://www.youtube.com/watch?v=VkUEWUxI6u0 |
| Q14.7 *(optional)* | 20. Option Price and Probability Duality | MIT OpenCourseWare | https://www.youtube.com/watch?v=eG_aRPy1KVE |

### Week 15: Market microstructure, market making and execution
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q15.1 | Lecture 1: Concepts and Institutions (Financial Markets Microstructure) | economification | https://www.youtube.com/watch?v=nPqat782ADI |
| Q15.2 *(optional)* | Lecture 3, part 1: Information and Prices (Financial Markets Microstructure) | economification | https://www.youtube.com/watch?v=P0-92CIfAUo |
| Q15.3 | Lecture 5, part 1: Depth determinants, Kyle Model (Financial Markets Microstructure) | economification | https://www.youtube.com/watch?v=0isdYyPNXis |
| Q15.4 | Lecture 12, part 1: High-Frequency and Algorithmic Trading (Financial Markets Microstructure) | economification | https://www.youtube.com/watch?v=II0tXd4nADo |
| Q15.5 🔎 *(optional search slot)* | One university-level lecture or talk by a recognized researcher (e.g. Robert Almgren, Charles-Albert Lehalle) on **optimal execution / the Almgren–Chriss model**. Search: `Almgren Chriss optimal execution lecture`, `Lehalle market microstructure in practice IPAM` | university, institute or conference channel only | none found on 2026-10-01 |

### Week 16: Risk management, machine learning and careers
| Key | Exact title | Channel | URL |
|---|---|---|---|
| Q16.1 | 7. Value At Risk (VAR) Models | MIT OpenCourseWare | https://www.youtube.com/watch?v=92WaNz9mPeY |
| Q16.2 *(optional)* | Quantopian Lecture Series: Leverage | Quantopian | https://www.youtube.com/watch?v=qBNmIjbBz3s |
| Q16.3 *(optional)* | Quantopian Lecture Series: Position Concentration Risk | Quantopian | https://www.youtube.com/watch?v=I1z7B2_FarQ |
| Q16.4 | Cornell University (ORIE 5256): Advances in Financial Machine Learning | Mathematical Investor | https://www.youtube.com/watch?v=UQSWzkqLp0U |
| Q16.5 *(optional)* | Stefan Jansen talks about Machine Learning for Algorithmic Trading | algoseek | https://www.youtube.com/watch?v=DC6DevRRSrs |
| Q16.6 | A Jane Street Trading Mock Interview with Graham and Andrea | Jane Street | https://www.youtube.com/watch?v=NT_I1MjckaU |
| Q16.7 *(optional)* | Jim Simons (full length interview) - Numberphile | Numberphile2 | https://www.youtube.com/watch?v=QNznD9hMEh0 |

The expected total is about **87 videos**, or 88 if the Q15.5 search slot is filled.

## 5. Quality rules for substitutions and search slots

- **Source priority:** MIT/Harvard/Yale/other universities on official channels, then recognized researchers and practitioners on their own, firm or conference channels, then strong specialist educators.
- Prefer content with definitions, equations, data and worked examples.
- **Reject** content that is hype, "get rich", sells signals or courses, comes from day-trading influencers, is a reaction video or a Short, or is a reupload of a lecture on a random channel.
- English is preferred.
- Never place an advanced item (stochastic calculus, Black–Scholes, ML) before its prerequisites (probability, statistics, regression).

## 6. Playlist description (paste as-is)

```text
16-ugers forløb: markeder → sandsynlighed → statistik → regression → porteføljer og faktorer → tidsrækker → backtesting og forskningsmetode → strategier → stokastisk calculus → derivater → mikrostruktur → risiko og ML.
Hører til studieplanen Quant_Trading_Research_Laeringsplan.md (nøgler Q1.1–Q16.7). Undervisning, ikke investeringsrådgivning.
```

## 7. Report

1. The playlist name and URL, and whether it was newly created or an existing one was updated.
2. The total number of videos.
3. Every substitution, with the requested item → the chosen video, the channel and the reason.
4. Search slots filled or skipped (Q12.1a/b must be found in the *AHL Explains* playlist; Q15.5 is optional).
5. Whether the top-to-bottom order check passed.

---

*Prepared 2026-10-01 as a companion to `Quant_Trading_Research_Laeringsplan.md`. All URLs were verified via YouTube oEmbed on 2026-10-01. Re-check availability at execution time.*

---

# Part 3 — CLOUD HANDOFF: YouTube playlist "Hedge Funds"

> **Kort på dansk (til Oliver):** Denne fil er opgavebeskrivelsen til en cloud-agent med browseradgang til din YouTube-konto. Agenten bygger playlisten, så den følger ugerne i `Hedge_Fund_Laeringsplan.md`. Hver video er angivet med præcis titel, kanal og URL. Alle blev tjekket 2026-10-01 via YouTubes oEmbed. Giv agenten hele filen. Resten er på engelsk.

---

## 0. Who this is for

You are a cloud agent with a browser that is signed in to the user's YouTube account. Your job is to build **one** ordered YouTube playlist from the list in section 4. Every item except the 🔎 search slots has a verified URL.

## 1. Primary task

**Playlist name:** `Hedge Funds - Structure, Strategies and Risk`
**Visibility:** Private, unless the user has told you otherwise.
**Description:** paste the text in section 6.

**Steps**

1. If a playlist with this name already exists, reuse it: add the missing items and fix the order. Otherwise create it.
2. For each item, open the URL. Check that the **title and channel match**, then add the video.
3. Keep the **exact order** of section 4. Items marked *(optional)* are added too.
4. **Search slots** (marked 🔎) are added **only if** a video clearly meets section 5. Otherwise skip the slot and report it.
5. Do **not** add duplicates, Shorts, reaction videos, reuploads of TV documentaries or lectures on unofficial channels, AI-narrated "documentary" channels, or trading-influencer content.
6. If a URL is dead, search for `"<exact title>" <channel>` and prefer the same channel. **Record every substitution.**
7. Review the playlist once from top to bottom.
8. Report as described in section 7.

**Do not:** like, comment, subscribe, change account or privacy settings, or accept optional cookies. Decline non-essential cookies if a consent banner appears. Do not delete anything except duplicates you created yourself.

**Verification tip:** `https://www.youtube.com/oembed?format=json&url=<video URL>` returns the exact title and channel.

## 2. Context

The learner is a Danish HTX student who is strong in math and Python. The companion file `Hedge_Fund_Laeringsplan.md` is a 12-week Danish study plan that refers to the videos by the keys **H1.1 … H12.3**. The arc runs:

**what a hedge fund is → structure & fees → valuation → long/short equity → global macro → event-driven & credit → relative value & LTCM → quant funds → risk & leverage → performance & due diligence → operations, regulation & ethics → launching a fund & careers.**

The material is educational. It is not investment advice.

## 3. Main sources

- **YaleCourses:** ECON 252 *Financial Markets* (Shiller). 2011 playlist: https://www.youtube.com/playlist?list=PL8FB14A2200B87185. 2008 playlist: https://www.youtube.com/playlist?list=PL8F7E2591EE283A2E. ECON 251 (Geanakoplos) lectures are on the same channel.
- **Aswath Damodaran (NYU Stern):** *Valuation Undergraduate Spring 2025*: https://www.youtube.com/playlist?list=PLUkh9m2BorqkYrFjNdut81IIcYdLfgqNd
- **Patrick Boyle**, a former hedge-fund manager and professor: individual videos.
- **Man AHL:** *AHL Explains*: https://www.youtube.com/playlist?list=PLwmBa3RpZcUrebD4o1TNt3d9wplBktmdS
- Do **not** use `PL88E6E5D45B6CD41A`, an unofficial copy of Yale ECON 252.

## 4. Ordered playlist contents (by week)

### Week 1: What is a hedge fund?
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H1.1 | Hedge funds, venture capital, and private equity \| Finance & Capital Markets \| Khan Academy | Khan Academy | https://www.youtube.com/watch?v=bLQBbA8yh7c |
| H1.2 | 20. Professional Money Managers and their Influence | YaleCourses | https://www.youtube.com/watch?v=txTaBKZ8qrs |
| H1.3 | 14. Guest Lecture by Andrew Redleaf | YaleCourses | https://www.youtube.com/watch?v=DMbhgSBIUfk |

### Week 2: Structure, fees and investors
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H2.1 | 9. Guest Lecture by David Swensen | YaleCourses | https://www.youtube.com/watch?v=AtSlRK0SZoM |
| H2.2 🔎 *(optional search slot)* | One credible explainer of hedge-fund **fees and structure** (2-and-20, high-water mark, hurdle, prime broker, administrator). Search: `Patrick Boyle hedge fund fees high water mark` | Patrick Boyle or a university channel | none verified |

### Week 3: Accounting and valuation
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H3.1 | William Ackman: Everything You Need to Know About Finance and Investing in Under an Hour \| Big Think | Big Think | https://www.youtube.com/watch?v=WEDIj9JBTC8 |
| H3.2 | Session 2: The Bermuda Triangle of Valuation | Aswath Damodaran | https://www.youtube.com/watch?v=Kv7j9SNexFM |
| H3.3 *(optional)* | Session 4: The DCF Big Picture and first steps on Riskfree rates | Aswath Damodaran | https://www.youtube.com/watch?v=bK6YC8oBX-c |
| H3.4 *(optional)* | Session 7: Betas, relative risk and first steps on cost of debt | Aswath Damodaran | https://www.youtube.com/watch?v=qWSxyWsA09w |
| H3.5 | Session 12: The Terminal Value | Aswath Damodaran | https://www.youtube.com/watch?v=A3MJAXEyJiY |

### Week 4: Long/short equity and short selling
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H4.1 | Session 21 (UG) and Session 19 (MBA): Pricing Analytics and Peer Groups | Aswath Damodaran | https://www.youtube.com/watch?v=rjqwM6ZTpA0 |
| H4.2 🔎 *(search slot)* | A short-selling mechanics explainer: `A Short Explanation of Short Selling (feat. Plain Bagel)` (PBS Two Cents), or The Plain Bagel's own short-selling video | PBS / The Plain Bagel only | none verified |
| H4.3 | Everything You Thought You Knew About GameStop Was Wrong! | Patrick Boyle | https://www.youtube.com/watch?v=3UOJ5tTZEZI |
| H4.4 *(optional)* | GameStop and Predatory Trading with Lasse Pedersen \| Markus Academy \| Ep. 54 | Markus' Academy | https://www.youtube.com/watch?v=ADnRm5LWCjg |

### Week 5: Global macro
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H5.1 | How The Economic Machine Works by Ray Dalio | Principles by Ray Dalio | https://www.youtube.com/watch?v=PHe0bXAIuk0 |
| H5.2 | 18. Monetary Policy | YaleCourses | https://www.youtube.com/watch?v=_SpIaGTq0u8 |
| H5.3 | How George Soros Broke the Bank of England | Patrick Boyle | https://www.youtube.com/watch?v=q4k8SGmJqIA |

### Week 6: Event-driven, credit and distressed
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H6.1 | Merger Arbitrage Hedge Fund Strategy ― How Does it Work? | Patrick Boyle | https://www.youtube.com/watch?v=VnQs_HhfYKI |
| H6.2 | 15. Guest Lecture by Carl Icahn | YaleCourses | https://www.youtube.com/watch?v=HlfgQ4_7EYA |
| H6.3 | Howard Marks: "Mastering the Market Cycle" | Goldman Sachs | https://www.youtube.com/watch?v=hMNxBHuzl4k |

### Week 7: Relative value, arbitrage and LTCM
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H7.1 | Long Term Capital Management and the Role of the Federal Reserve | Ludwig Chincarini | https://www.youtube.com/watch?v=i5KfP293MVQ |
| H7.2 | Victor Haghani - LTCM to Elm Partners | Patrick Boyle | https://www.youtube.com/watch?v=6BUatQ10HA4 |
| H7.3 *(optional)* | 8. Theory of Debt, Its Proper Role, Leverage Cycles | YaleCourses | https://www.youtube.com/watch?v=3Ir6sbDAx4c |

### Week 8: Quantitative and systematic funds
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H8.1 | The mathematician who cracked Wall Street \| Jim Simons | TED | https://www.youtube.com/watch?v=U5kIdtMJGc8 |
| H8.2 *(optional)* | An introduction to Man AHL | Man AHL | https://www.youtube.com/watch?v=zf91UDTxbSM |
| H8.3 | AHL Explains - Momentum | Man AHL | https://www.youtube.com/watch?v=D_WhInJePC8 |
| H8.4 | Cliff Asness on Factor Investing and the History of Financial Economics \| Capitalism and Freedom | Hoover Institution | https://www.youtube.com/watch?v=2QrPCewZO9E |
| H8.5 | Adaptive Markets: Financial Evolution At The Speed Of Thought \| Andrew W. Lo \| Talks at Google | Talks at Google | https://www.youtube.com/watch?v=__teQiAK0dg |
| H8.6 *(optional)* | Winton Founder David Harding on Rewriting His Hedge Fund's Strategy | Bloomberg Television | https://www.youtube.com/watch?v=LiuRFzLgPn4 |

### Week 9: Risk management, leverage and blow-ups
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H9.1 | Archegos Capital Blowup \| Bill Hwang's Margin Call | Patrick Boyle | https://www.youtube.com/watch?v=2t4lGmNDiHo |
| H9.2 *(optional)* | 7. Value At Risk (VAR) Models | MIT OpenCourseWare | https://www.youtube.com/watch?v=92WaNz9mPeY |
| H9.3 *(optional, advanced)* | 25. The Leverage Cycle and the Subprime Mortgage Crisis | YaleCourses | https://www.youtube.com/watch?v=lb5Q1Jur0I0 |
| H9.4 *(optional, advanced)* | 26. The Leverage Cycle and Crashes | YaleCourses | https://www.youtube.com/watch?v=yenfxh_arkg |
| H9.5 🔎 *(optional search slot)* | **Amaranth Advisors 2006**, only from an official source, e.g. the 2007 U.S. Senate Permanent Subcommittee on Investigations hearing on C-SPAN, or a Patrick Boyle video. Search: `Amaranth natural gas Senate hearing 2007 C-SPAN` | official / Patrick Boyle only | none verified |

### Week 10: Performance, allocators and due diligence
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H10.1 | 2010 Methods Lecture, Andrew Lo, "Financial Econometrics in Action Analyzing Hedge Funds and..." | NBER | https://www.youtube.com/watch?v=kpGNvgzwDSE |
| H10.2 | 60 Minutes Archive: The man who figured out Madoff's Ponzi scheme | 60 Minutes | https://www.youtube.com/watch?v=3wUJesUik5A |
| H10.3 🔎 *(optional search slot)* | An operational or investment **due-diligence** webinar from **CAIA Association** or **CFA Institute**. Search: `CAIA hedge fund due diligence webinar`, `CFA Institute operational due diligence hedge funds` | CAIA / CFA Institute only | none verified |

### Week 11: Operations, regulation and ethics
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H11.1 | 8. Human Foibles, Fraud, Manipulation, and Regulation | YaleCourses | https://www.youtube.com/watch?v=LEB2k9jJzzc |
| H11.2 *(optional)* | Opening Statement of Harry Markopolos | PublicResourceOrg | https://www.youtube.com/watch?v=AF-gzN3ppbE |
| H11.3 *(optional)* | Melvin Capital, Citadel CEOs on short selling interest in GameStop | CNBC Television | https://www.youtube.com/watch?v=fLVl9QfbrG0 |
| H11.4 🔎 *(optional search slot)* | FRONTLINE **"To Catch a Trader"** (SAC Capital), **only** from the official FRONTLINE PBS channel | FRONTLINE PBS | none verified |

### Week 12: Launching a fund, culture and careers
| Key | Exact title | Channel | URL |
|---|---|---|---|
| H12.1 | How to build a company where the best ideas win \| Ray Dalio | TED | https://www.youtube.com/watch?v=HXbsVbFAczg |
| H12.2 *(optional)* | Jim Simons (full length interview) - Numberphile | Numberphile2 | https://www.youtube.com/watch?v=QNznD9hMEh0 |
| H12.3 🔎 *(optional search slot)* | One credible explainer of **multi-manager "pod" funds** (Citadel, Millennium, Balyasny). Search: `Patrick Boyle multi-manager hedge funds pod shops`, `Bloomberg Odd Lots multi-strategy hedge funds` | Patrick Boyle / Bloomberg only | none verified |

The expected total is **38 videos** plus up to 6 search slots: H2.2, H4.2, H9.5, H10.3, H11.4 and H12.3.

## 5. Quality rules for substitutions and search slots

- **Source priority:** universities (official channels), then recognized practitioners and researchers on their own, firm or conference channels, then credible specialist educators (e.g. Patrick Boyle, The Plain Bagel), then official news or government sources for case studies.
- **Reject:** AI-narrated "documentary" channels, reuploads of TV documentaries, trading-influencer content, sensational titles without substance, and Shorts.
- English is preferred.

## 6. Playlist description (paste as-is)

```text
12-ugers forløb om hedgefonde: struktur og gebyrer → værdiansættelse → long/short → makro → event-driven og kredit → relativ værdi og LTCM → kvantfonde → risiko og gearing → performance og due diligence → regulering og etik → at starte en fond.
Hører til studieplanen Hedge_Fund_Laeringsplan.md (nøgler H1.1–H12.3). Undervisning, ikke investeringsrådgivning.
```

## 7. Report

1. The playlist name and URL, and whether it was newly created or an existing one was updated.
2. The total number of videos.
3. Every substitution, with the requested item → the chosen video, the channel and the reason.
4. The search slots filled or skipped.
5. Whether the top-to-bottom order check passed.

---

*Prepared 2026-10-01 as a companion to `Hedge_Fund_Laeringsplan.md`. All URLs were verified via YouTube oEmbed on 2026-10-01.*
