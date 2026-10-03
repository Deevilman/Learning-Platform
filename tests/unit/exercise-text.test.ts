import { describe, expect, it } from 'vitest'
import { applyForwardRefs, displayLongMath, findForwardRefs, splitSubquestions } from '../../scripts/lib/exercise-text'

describe('splitSubquestions', () => {
  it('turns inline (a) (b) (c) into a list with an intro', () => {
    const md = 'Afgør sandhedsværdien: (a) "Hvis $2 + 2 = 5$, så …" (b) "Hvis $2+2=4$, så er $7$ lige." (c) Alle grønne marsmænd.'
    expect(splitSubquestions(md)).toBe('Afgør sandhedsværdien:\n\n- **(a)** "Hvis $2 + 2 = 5$, så …"\n- **(b)** "Hvis $2+2=4$, så er $7$ lige."\n- **(c)** Alle grønne marsmænd.')
  })
  it('works without an intro and in solutions', () => {
    expect(splitSubquestions('(a) $1$ (b) $2$')).toBe('- **(a)** $1$\n- **(b)** $2$')
  })
  it('keeps later references such as "(b)" inside item (c) in place', () => {
    const out = splitSubquestions('Vis: (a) A. (b) B. (c) Forklar, hvorfor (b) betyder noget.')
    expect(out).toContain('- **(c)** Forklar, hvorfor (b) betyder noget.')
    expect(out.match(/^- /gm)).toHaveLength(3)
  })
  it('ignores markers inside math, code and italic hints', () => {
    expect(splitSubquestions('Lad $f(a) (b)$ være givet.')).toBe('Lad $f(a) (b)$ være givet.')
    expect(splitSubquestions('Kør `g (a) (b)` nu.')).toBe('Kør `g (a) (b)` nu.')
    const md = 'Opgave (a) X (b) Y *Hint til (c):* tænk.'
    expect(splitSubquestions(md)).toContain('- **(b)** Y *Hint til (c):* tænk.')
  })
  it('leaves single markers, lists and code blocks alone', () => {
    expect(splitSubquestions('Kun (a) her.')).toBe('Kun (a) her.')
    const list = '- (a) første\n- (b) anden'
    expect(splitSubquestions(list)).toBe(list)
    const multi = 'Første afsnit.\n\n(a) x (b) y'
    expect(splitSubquestions(multi)).toBe('Første afsnit.\n\n- **(a)** x\n- **(b)** y')
  })
})

describe('forward references', () => {
  it('finds remarks that point ahead, as the smallest parenthesis or sentence', () => {
    const md = 'Afgør. *(Forsmag på kvantorerne i uge 2.)* Næste.\n\nSå er $m=0$.\n\nDette bruges i uge 6: (b) til noget. Slut.'
    const refs = findForwardRefs(md).map((r) => r.text)
    expect(refs).toContain('*(Forsmag på kvantorerne i uge 2.)*')
    expect(refs).toContain('Dette bruges i uge 6: (b) til noget.')
    expect(findForwardRefs('Se uge 4 for detaljer.').map((r) => r.text)).toEqual(['Se uge 4 for detaljer.'])
    expect(findForwardRefs('Den sidste vender tilbage i Gödel-ugerne.')).toHaveLength(1)
    expect(findForwardRefs('Ingen henvisninger her.')).toHaveLength(0)
  })
  it('applies reviewed rules and tidies the text', () => {
    const md = 'Vis det. *(Forsmag på uge 2.)* (Bruges i uge 7.) Og (Funktionerne genbruges i uge 10.)'
    const { md: out, problems } = applyForwardRefs(md, [
      { text: '*(Forsmag på uge 2.)*', action: 'remove' },
      { text: '(Bruges i uge 7.)', action: 'keep' },
      { text: '(Funktionerne genbruges i uge 10.)', action: 'replace', with: '(Gem din kode.)' },
    ])
    expect(problems).toEqual([])
    expect(out).toBe('Vis det. (Bruges i uge 7.) Og (Gem din kode.)')
  })
  it('reports rules that do not match exactly once', () => {
    expect(applyForwardRefs('a a', [{ text: 'a', action: 'remove' }]).problems[0]).toMatch(/2 gange/)
    expect(applyForwardRefs('b', [{ text: 'a', action: 'remove' }]).problems[0]).toMatch(/0 gange/)
  })
})

describe('displayLongMath', () => {
  const long = '\\forall x \\in \\mathbb{R}\\, \\forall y \\in \\mathbb{R}\\, \\big( x < y \\to \\exists r \\in \\mathbb{Q}\\, (x < r \\wedge r < y) \\big)'
  it('moves long inline formulas to display math', () => {
    expect(displayLongMath(`Vis at $${long}$ gælder.`)).toBe(`Vis at\n\n$$\n${long}\n$$\n\ngælder.`)
  })
  it('keeps the formula inside its list item', () => {
    expect(displayLongMath(`- **(a)** $${long}$.`)).toBe(`- **(a)**\n\n  $$\n  ${long}.\n  $$`)
  })
  it('leaves short formulas, code and display math alone', () => {
    const md = `Kort $x+1$.\n\n\`\`\`\n$${long}$\n\`\`\`\n\n$$\n${long}\n$$`
    expect(displayLongMath(md)).toBe(md)
  })
})

describe('sub-answers split over paragraphs', () => {
  it('bolds a lone leading letter', () => {
    expect(splitSubquestions('(a)\n\n$$\nx\n$$\n\n(b) Videre.')).toBe('**(a)**\n\n$$\nx\n$$\n\n**(b)** Videre.')
  })
})

import { firstStep } from '../../scripts/lib/exercise-text'
describe('first step hint', () => {
  it('cuts the result off a calculation', () => {
    expect(firstStep('$r = 1{,}04/1{,}025 - 1 = 1{,}463\\,\\%$; tilnærmelse $1{,}5\\,\\%$.')).toBe('$r = 1{,}04/1{,}025 - 1$ …')
  })
  it('never cuts inside braces', () => {
    expect(firstStep('(a) $\\ln(W_n/W_0) = \\sum_{k=1}^n\\ln(1 + fX_k)$. Leddene er iid.')).toBe('$\\ln(W_n/W_0) = \\sum_{k=1}^n\\ln(1 + fX_k)$.')
  })
  it('gives nothing when the sentence is only the answer', () => {
    expect(firstStep('$L = 26{,}6$.')).toBeUndefined()
    expect(firstStep('Svaret er **42**, fordi det er sådan.')).toBeUndefined()
  })
})

describe('forward-reference removal leaves code alone', () => {
  it('keeps indentation and leaves untouched text identical', () => {
    const code = '```python\nfor x in xs:\n    if x:\n        print(x)\n```'
    expect(applyForwardRefs(`Kør:\n\n${code}`, []).md).toBe(`Kør:\n\n${code}`)
    const md = `Vis det. (Bruges i uge 7.)\n\n${code}\n\n- liste\n  - indrykket`
    expect(applyForwardRefs(md, [{ text: '(Bruges i uge 7.)', action: 'remove' }]).md).toBe(`Vis det.\n\n${code}\n\n- liste\n  - indrykket`)
  })
})

describe('sub-questions never touch code', () => {
  it('skips paragraphs inside a code block with blank lines', () => {
    const md = '```python\nprint("(a) x (b) y")\n\nprint("(a) 1 (b) 2")\n```\n\n(a) x (b) y'
    expect(splitSubquestions(md)).toBe('```python\nprint("(a) x (b) y")\n\nprint("(a) 1 (b) 2")\n```\n\n- **(a)** x\n- **(b)** y')
  })
})
