// Text clean-up for exercises, applied at build time (plan.md is never edited):
//  - splitSubquestions: inline "(a) … (b) …" become a list
//  - findForwardRefs / applyForwardRefs: remarks that point ahead in the course
//    ("vender tilbage i uge 9", "forsmag på …") are proposed by a scanner and
//    removed according to a reviewed list (content/courses/<slug>/forward-refs.yaml).

/** Ranges of inline/display math and code spans, which must never be cut. */
function protectedRanges(s: string): [number, number][] {
  const out: [number, number][] = []
  const re = /\$\$[\s\S]*?\$\$|\$(?:\\.|[^$\\\n])+\$|`[^`\n]*`/g
  for (const m of s.matchAll(re)) out.push([m.index!, m.index! + m[0].length])
  return out
}
const inside = (ranges: [number, number][], i: number) => ranges.some(([a, b]) => i >= a && i < b)

const LETTERS = 'abcdefghijklmn'

/**
 * Split a paragraph with inline sub-questions "(a) … (b) … (c) …" into an
 * intro and a Markdown list. Only a run that starts at (a) and continues in
 * alphabetical order counts, so later references such as "brug (b)" inside
 * item (c) stay where they are. Paragraphs that already are lists, code or
 * display math are left alone.
 */
export function splitSubquestions(md: string): string {
  return md
    .split(/\n{2,}/)
    .map((para) => splitParagraph(para))
    .join('\n\n')
}

function splitParagraph(para: string): string {
  const trimmed = para.trimStart()
  if (/^([-*+]\s|\d+\.\s|>|```|\$\$|\||<)/.test(trimmed) || para.includes('\n- ') || para.includes('\n```')) return para
  const ranges = protectedRanges(para)
  const marks: { index: number; end: number; letter: string }[] = []
  const re = /(^|[\s:;.,!?—–])\(([a-n])\)(?=\s)/g
  let expect = 0
  for (const m of para.matchAll(re)) {
    const index = m.index! + m[1].length
    if (inside(ranges, index)) continue
    // Skip markers inside an italic hint such as "*Hint til (c):*".
    if (/\*(?:Hint|Vink)[^*]*$/i.test(para.slice(0, index))) continue
    if (m[2] === LETTERS[expect]) {
      marks.push({ index, end: index + m[0].length - m[1].length, letter: m[2] })
      expect++
    }
  }
  // A paragraph that starts with a lone "(b)" (a sub-answer split over paragraphs): bold the letter.
  if (marks.length < 2) return para.replace(/^(\s*)\(([a-n])\)(?=\s|$)/, '$1**($2)**')
  const intro = para.slice(0, marks[0].index).trim()
  const items = marks.map((mk, i) => para.slice(mk.end, i + 1 < marks.length ? marks[i + 1].index : undefined).trim().replace(/\s*\n\s*/g, ' '))
  const list = items.map((t, i) => `- **(${marks[i].letter})** ${t}`).join('\n')
  return intro ? `${intro}\n\n${list}` : list
}

// ---------------------------------------------------------------- forward references

export const FORWARD_PATTERNS: RegExp[] = [/vender\s+tilbage/i, /bruges\s+(?:igen\s+)?i\s+uge/i, /\bse\s+uge\s+\d+/i, /forsmag\s+på/i, /\bforsmag\b/i, /forbereder/i, /kommer\s+(?:igen\s+)?i\s+uge/i]

export interface ForwardRef {
  text: string // exact text to remove (the smallest parenthesis or sentence around the match)
  pattern: string
}

/** Smallest "(…)" / "*(…)*" around position i, else the sentence around it. */
function enclosing(s: string, i: number): string {
  let depth = 0
  for (let a = i; a >= 0; a--) {
    const c = s[a]
    if (c === ')' && a !== i) depth++
    else if (c === '(') {
      if (depth === 0) {
        let d = 0
        for (let b = a; b < s.length; b++) {
          if (s[b] === '(') d++
          else if (s[b] === ')' && --d === 0) {
            let from = a
            let to = b + 1
            // include surrounding emphasis "*(…)*" / "_(…)_"
            while (from > 0 && /[*_]/.test(s[from - 1]) && /[*_]/.test(s[to] || '')) (from--, to++)
            return s.slice(from, to)
          }
        }
        break
      }
      depth--
    }
  }
  // sentence: within the paragraph, from the previous sentence end to the next one
  let start = i
  while (start > 0 && !/[.!?]\s$/.test(s.slice(start - 2, start)) && s[start - 1] !== '\n') start--
  let end = i
  while (end < s.length && s[end] !== '\n' && !(/[.!?]/.test(s[end]) && (end + 1 >= s.length || /\s/.test(s[end + 1])))) end++
  return s.slice(start, Math.min(end + 1, s.length))
}

export function findForwardRefs(md: string, week?: number): ForwardRef[] {
  const out: ForwardRef[] = []
  const ranges = protectedRanges(md)
  // any "uge N" / "ugerne N–M" that lies after the exercise's own week
  const later = week ? [new RegExp(`\\buge(?:rne)?\\s+(?:${Array.from({ length: 30 }, (_, i) => i + 1).filter((n) => n > week).join('|')})\\b`, 'i')] : []
  for (const p of [...FORWARD_PATTERNS, ...later]) {
    const g = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g')
    for (const m of md.matchAll(g)) {
      if (inside(ranges, m.index!)) continue
      const text = enclosing(md, m.index!).trim()
      if (text && !out.some((o) => o.text === text || o.text.includes(text))) out.push({ text, pattern: p.source })
    }
  }
  return out
}

export interface ForwardRefRule {
  text: string
  action: 'remove' | 'replace' | 'keep'
  with?: string
}

/**
 * Apply reviewed rules to one exercise text. Each non-"keep" rule must match
 * exactly once; problems are returned as messages (the build reports them).
 */
export function applyForwardRefs(md: string, rules: ForwardRefRule[]): { md: string; problems: string[] } {
  const problems: string[] = []
  let out = md
  for (const r of rules) {
    if (r.action === 'keep') continue
    const n = out.split(r.text).length - 1
    if (n !== 1) {
      problems.push(`"${r.text.slice(0, 60)}" findes ${n} gange (skal være præcis 1)`)
      continue
    }
    out = out.replace(r.text, r.action === 'replace' ? r.with || '' : '')
  }
  // tidy up what removal leaves behind
  out = out
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
  return { md: out, problems }
}

// ---------------------------------------------------------------- long formulas

const INLINE_MATH = /(?<![$\\])\$(?!\$)((?:\\.|[^$\\\n])+)\$(?!\$)/g

/**
 * Inline formulas longer than `limit` characters cannot wrap and make the line
 * scroll sideways. Put them on their own line as display math. Inside a list
 * item the display block is indented so it stays in that item.
 */
export function displayLongMath(md: string, limit = 90): string {
  const out: string[] = []
  let fence = false
  let display = false
  for (const line of md.split('\n')) {
    const t = line.trim()
    if (/^(```|~~~)/.test(t)) fence = !fence
    if (fence || /^(```|~~~)/.test(t)) {
      out.push(line)
      continue
    }
    if (t === '$$' || (t.startsWith('$$') && !t.endsWith('$$'))) display = !display
    if (display || t.startsWith('$$') || /^[|>]/.test(t)) {
      out.push(line)
      continue
    }
    const long = [...line.matchAll(INLINE_MATH)].filter((m) => m[1].length > limit)
    if (!long.length) {
      out.push(line)
      continue
    }
    const marker = /^(\s*)([-*+]|\d+\.)\s+/.exec(line)
    const indent = marker ? ' '.repeat(marker[0].length) : /^\s*/.exec(line)![0]
    let pos = 0
    let first = true
    const push = (text: string) => {
      const s = text.trim()
      if (!s || /^[.,;:]$/.test(s)) return
      out.push(first ? line.slice(0, line.length - line.trimStart().length) + s : indent + s, '')
      first = false
    }
    for (const m of long) {
      push(line.slice(pos, m.index))
      if (first && marker) (out.push(marker[0].trimEnd(), ''), (first = false))
      first = false
      pos = m.index! + m[0].length
      // ", så …" / ". Videre" after the formula: the punctuation belongs to the formula
      const punct = /^[.,;:]/.exec(line.slice(pos))?.[0] || ''
      pos += punct.length
      out.push(indent + '$$', indent + m[1].trim() + punct, indent + '$$', '')
    }
    push(line.slice(pos))
    while (out[out.length - 1] === '') out.pop()
  }
  return out.join('\n')
}
