# CLOUD HANDOFF: YouTube playlist "Hedge Funds"

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
