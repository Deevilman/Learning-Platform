// Bite-sized lessons: split a week's "Kernebegreber" into short steps with
// one idea each. A step starts at a section lead such as "<p><strong>3.
// Uafhængighed.</strong>" (or a heading). "Prøv selv" components stay with
// the step before them; very short steps are merged into the previous one.

export interface LessonStep {
  title: string
  html: string
}

const NOT_A_SECTION = /^(Sætning|Bevis|Eksempel|Bemærk|Prøv selv|Lemma|Korollar|Definition|Hint|Note|Advarsel|Husk|Fx|Obs)\b/i
const MIN_TEXT = 220

function leadOf(el: Element): string | null {
  if (/^H[1-4]$/.test(el.tagName)) return el.textContent?.trim() || null
  if (el.tagName !== 'P') return null
  const first = el.firstElementChild
  if (!first || first.tagName !== 'STRONG') return null
  // the bold text must open the paragraph
  const before = el.innerHTML.slice(0, el.innerHTML.indexOf('<strong'))
  if (before.trim()) return null
  return first.textContent?.trim() || null
}

const cleanTitle = (t: string) =>
  t
    .replace(/^\d+\.\s*/, '')
    .replace(/[.:]\s*$/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()

export function splitLesson(html: string, doc: Document = new DOMParser().parseFromString('<body></body>', 'text/html')): LessonStep[] {
  const root = doc.createElement('div')
  root.innerHTML = html
  const blocks = Array.from(root.children)
  const leads = blocks.map(leadOf)
  const numbered = leads.filter((l) => l && /^\d+\.\s/.test(l)).length >= 3
  const isStart = (l: string | null) => !!l && (numbered ? /^\d+\.\s/.test(l) || /^Typiske fejl/i.test(l) : !NOT_A_SECTION.test(l))

  const steps: { title: string; parts: Element[] }[] = []
  blocks.forEach((el, i) => {
    const lead = leads[i]
    if (!steps.length || isStart(lead)) steps.push({ title: lead ? cleanTitle(lead) : 'Introduktion', parts: [el] })
    else steps[steps.length - 1].parts.push(el)
  })
  // merge tiny steps into the one before (but keep the first step)
  const merged: typeof steps = []
  for (const s of steps) {
    const text = s.parts.map((p) => p.textContent || '').join(' ').trim()
    const hasWidget = s.parts.some((p) => p.querySelector?.('.interactive') || p.classList?.contains('interactive'))
    if (merged.length && text.length < MIN_TEXT && !hasWidget) merged[merged.length - 1].parts.push(...s.parts)
    else merged.push(s)
  }
  return merged.map((s) => ({ title: s.title, html: s.parts.map((p) => p.outerHTML).join('\n') }))
}
