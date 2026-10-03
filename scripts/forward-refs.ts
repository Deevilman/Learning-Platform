// npm run forward-refs
// Scans every exercise (prompt, hint, solution) for remarks that point ahead
// in the course — "vender tilbage", "bruges i uge", "se uge N", "forsmag på",
// "(uge N)" after the exercise's own week — and adds new finds to the course
// file's front matter under forward_refs with `action: review`. A person then
// sets each to remove / replace / keep; the build applies the list (the plan
// itself is never edited) and refuses entries left at "review".

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parsePlan } from './lib/plan-parser.ts'
import { findForwardRefs } from './lib/exercise-text.ts'
import { parseCoursePack } from './lib/course-pack.ts'
import { listPacks, writePack } from './lib/pack-file.ts'

const ROOT = join(import.meta.dirname, '..')
let added = 0
for (const pack of listPacks(ROOT)) {
  const parsed = parseCoursePack(readFileSync(pack.path, 'utf8'), pack.path)
  if (!parsed.source) continue
  const plan = parsePlan(parsed.source.plan)
  const data: Record<string, { field: string; text: string; action: string; with?: string }[]> = (pack.fm.toJS().forward_refs as never) || {}
  let changed = false
  for (const w of plan.weeks) {
    const sols = new Map(w.solutions.map((s) => [s.number, s]))
    for (const e of w.exercises) {
      const sol = sols.get(e.number)
      for (const [field, md] of [['prompt', e.prompt], ['hint', sol?.hint], ['solution', sol?.body]] as const) {
        if (!md) continue
        for (const r of findForwardRefs(md, w.number)) {
          const list = (data[e.number] ||= [])
          // already reviewed (possibly narrowed to part of the sentence)
          if (list.some((x) => x.field === field && (x.text === r.text || r.text.includes(x.text) || x.text.includes(r.text)))) continue
          list.push({ field, text: r.text, action: 'review' })
          added++
          changed = true
        }
      }
    }
  }
  if (changed) {
    pack.fm.set('forward_refs', pack.fm.createNode(data))
    writePack(pack)
  }
}
console.log(`${added} nye forslag skrevet til forward_refs i kursusfilerne`)
