// Danish → US number format in course text. Certain cases are converted
// ("0,25" → "0.25", "1.000.000" → "1,000,000", "0{,}25" → "0.25" in math);
// unclear ones ("2,500", "(0,1)", "1.645") are left alone and reported, so a
// person can decide. Code, URLs and the special YAML blocks are never touched.

export interface NumberReview {
  line: number
  text: string // the number as written
  context: string // a little text around it
  reason: string
}

export interface NumberConversion {
  text: string
  changes: number
  review: NumberReview[]
}

// code fences, inline code, URLs, display math, inline math (an escaped \$ is not a delimiter)
const SEGMENTS = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`|https?:\/\/[^\s)>\]]+|\$\$[\s\S]*?\$\$|(?<![\\$])\$(?!\$)(?:\\\$|[^$\n])+?\$/g
const UNIT_AFTER = /^\s?(kr|mio|mia|aktier|stk|personer|dage|år|usd|dkk|eur|dollars?|euro|\$|%|bp|t\b|timer|ord|sider)/i

/**
 * `migrate`: the text is Danish (a plan as written): "2,500" and "1.645" are
 * unclear and reported. `us`: the text is already in US format, so "2,500" is
 * two thousand five hundred and "1.645" a decimal; only certain Danish forms
 * are converted (and reported by the build).
 */
export function convertNumbers(src: string, mode: 'migrate' | 'us' = 'migrate'): NumberConversion {
  const review: NumberReview[] = []
  let changes = 0
  const lineAt = (i: number) => src.slice(0, i).split('\n').length
  const note = (base: number, at: number, seg: string, len: number, reason: string) =>
    review.push({ line: lineAt(base + at), text: seg.slice(at, at + len), context: seg.slice(Math.max(0, at - 30), at + len + 30).replace(/\s+/g, ' ').trim(), reason })

  function thousands(seg: string, base: number, math: boolean): string {
    // 1.234.567 (two or more groups) is always thousands; one group needs a hint
    return seg.replace(/(?<![\d.,])(\d{1,3})((?:\.\d{3})+)(?![\d]|[.,]\d)/g, (m, left: string, groups: string, at: number) => {
      if (left === '0') return m // 0.125 is a decimal number already
      // course codes like MIT 18.404J or 15.401
      if (/[A-Za-z]/.test(seg[at + m.length] || '') || /(MIT|OCW|OpenCourseWare|Lo|Strang)\W{0,3}$/.test(seg.slice(Math.max(0, at - 18), at))) return m
      const n = groups.length / 4
      const sure = n >= 2 || (mode === 'migrate' && (groups.endsWith('00') || UNIT_AFTER.test(seg.slice(at + m.length))))
      if (!sure) {
        if (mode === 'us') return m
        note(base, at, seg, m.length, 'Tusindtalspunktum eller decimaltal?')
        return m
      }
      changes++
      return math ? left + groups.replace(/\./g, '') : left + groups.replace(/\./g, ',')
    })
  }

  function text(seg: string, base: number): string {
    // 1.234,5: Danish thousands and decimals together
    seg = seg.replace(/(?<![\d.,])(\d{1,3}(?:\.\d{3})+),(\d+)(?![\d]|[.,]\d)/g, (_m, int: string, dec: string) => {
      changes++
      return `${int.replace(/\./g, ',')}.${dec}`
    })
    // lists like 1,2,3 are not numbers
    seg.replace(/(?<![\d.,])\d+(,\d+){2,}(?![\d])/g, (m, _g, at: number) => (/^\d{1,3}(,\d{3})+$/.test(m) && mode === 'us' ? m : (note(base, at, seg, m.length, 'Liste eller decimaltal?'), m)))
    seg = seg.replace(/(?<![\d.,])(\d+),(\d+)(?![\d]|[.,]\d)/g, (m, left: string, right: string, at: number) => {
      const before = seg[at - 1] || ''
      const after = seg[at + m.length] || ''
      if (/[([]/.test(before) && /[)\]]/.test(after)) return mode === 'us' ? m : note(base, at, seg, m.length, 'Par/interval eller decimaltal?'), m

      if (right.length === 3 && left !== '0' && mode === 'us') return m
      if (right.length === 3 && left !== '0') return note(base, at, seg, m.length, 'Decimaltal (dansk) eller tusindtal (engelsk)?'), m
      changes++
      return `${left}.${right}`
    })
    return thousands(seg, base, false)
  }

  function math(seg: string, base: number): string {
    // 14.802{,}44: Danish thousands and decimals together
    seg = seg.replace(/(?<![\d.,])(\d{1,3}(?:\.\d{3})+)\{,\}(\d+)/g, (_m, int: string, dec: string) => {
      changes++
      return `${int.replace(/\./g, '')}.${dec}`
    })
    // thousands first, so 1{,}552 (a decimal) isn't mistaken for 1.552 thousands
    seg = thousands(seg, base, true)
    seg = seg.replace(/(\d)\{,\}([\dA-Za-z(\\])/g, (_m, a: string, b: string) => {
      changes++
      return `${a}.${b}`
    })
    // a bare comma between digits in math is usually a separator: (0,1), {0,1,2}; flag a lone 0,5
    seg.replace(/(?<![\d.,])0,(\d+)(?![\d]|,\d)/g, (m, _r, at: number) => {
      const before = seg[at - 1] || ''
      if (!/[([{,]/.test(before) && !/\\lbrace\s*$/.test(seg.slice(0, at))) note(base, at, seg, m.length, 'Decimaltal i en formel? Skriv 0.5')
      return m
    })
    return seg
  }

  let out = ''
  let last = 0
  for (const m of src.matchAll(SEGMENTS)) {
    const i = m.index!
    out += text(src.slice(last, i), last)
    const s = m[0]
    out += s.startsWith('$') ? math(s, i) : s
    last = i + s.length
  }
  out += text(src.slice(last), last)
  return { text: out, changes, review }
}

/** Danish-looking numbers left in a text that should be in US format (for build warnings). */
export function danishNumbers(src: string): NumberReview[] {
  const r = convertNumbers(src, 'us')
  if (!r.changes) return r.review
  // report what would be converted too: compare token by token is overkill, so name the first lines
  const a = src.split('\n')
  const b = r.text.split('\n')
  const changed: NumberReview[] = []
  for (let i = 0; i < a.length && changed.length < 50; i++)
    if (a[i] !== b[i]) {
      const m = /\d[\d.]*\{?,\}?\d+/.exec(a[i])
      changed.push({ line: i + 1, text: m?.[0] || '', context: a[i].trim().slice(0, 80), reason: 'Dansk talformat' })
    }
  return [...changed, ...r.review]
}
