# CLOUD HANDOFF: YouTube playlist "Quant Trading & Research"

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
