// npm run forward-refs
// Scans every exercise (prompt, hint, solution) for remarks that point ahead
// in the course — "vender tilbage", "bruges i uge", "se uge N", "forsmag på" —
// and adds new finds to content/courses/<slug>/forward-refs.yaml with
// `action: review`. A person then sets each to remove / replace / keep; the
// build applies the list (plan.md itself is never edited) and refuses
// entries left at "review".

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yaml'
import { parsePlan } from './lib/plan-parser.ts'
import { findForwardRefs } from './lib/exercise-text.ts'

const ROOT = join(import.meta.dirname, '..')
const dir = join(ROOT, 'content/courses')
let added = 0
for (const slug of readdirSync(dir)) {
  const planFile = join(dir, slug, 'plan.md')
  if (!existsSync(planFile)) continue
  const plan = parsePlan(readFileSync(planFile, 'utf8'))
  const file = join(dir, slug, 'forward-refs.yaml')
  const data: Record<string, { field: string; text: string; action: string; with?: string }[]> = existsSync(file) ? YAML.parse(readFileSync(file, 'utf8'))?.exercises || {} : {}
  for (const w of plan.weeks) {
    const sols = new Map(w.solutions.map((s) => [s.number, s]))
    for (const e of w.exercises) {
      const sol = sols.get(e.number)
      for (const [field, md] of [['prompt', e.prompt], ['hint', sol?.hint], ['solution', sol?.body]] as const) {
        if (!md) continue
        for (const r of findForwardRefs(md, w.number)) {
          const list = (data[e.number] ||= [])
          if (list.some((x) => x.field === field && x.text === r.text)) continue
          list.push({ field, text: r.text, action: 'review' })
          added++
        }
      }
    }
  }
  if (!Object.keys(data).length) continue
  const header = `# Henvisninger frem i kurset ("vender tilbage i uge 9", "forsmag på …"), fundet af npm run forward-refs.\n# action: remove (slet teksten) · replace (erstat med "with") · keep (behold). "review" stopper bygget.\n# Teksten skal stå præcis én gang i feltet (prompt, hint eller solution). plan.md ændres aldrig.\n`
  writeFileSync(file, header + YAML.stringify({ exercises: data }, { lineWidth: 0, indentSeq: false }))
}
console.log(`${added} nye forslag skrevet til forward-refs.yaml`)
