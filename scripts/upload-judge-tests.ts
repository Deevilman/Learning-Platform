// Deploy step: upload the hidden tests and reference solutions (.judge/problems.json,
// written by `npm run content`) to Supabase table problem_tests, where only the
// judge's Edge Function can read them. Needs SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY (GitHub secrets — never in the app). Without them
// it does nothing.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { ServerProblem } from './lib/problems.ts'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const file = join(import.meta.dirname, '..', '.judge', 'problems.json')
if (!url || !key) {
  console.log('Ingen SUPABASE_SERVICE_ROLE_KEY — springer upload af skjulte tests over.')
  process.exit(0)
}
const problems: ServerProblem[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
const sb = createClient(url, key, { auth: { persistSession: false } })
const rows = problems.map((p) => ({ id: p.id, course: p.course, data: p, updated_at: new Date().toISOString() }))
if (rows.length) {
  const { error } = await sb.from('problem_tests').upsert(rows)
  if (error) throw new Error(error.message)
}
// problems that no longer exist
const { data } = await sb.from('problem_tests').select('id')
const gone = (data || []).map((r: { id: string }) => r.id).filter((id: string) => !problems.some((p) => p.id === id))
if (gone.length) await sb.from('problem_tests').delete().in('id', gone)
console.log(`✓ ${rows.length} kodeopgaver hos dommeren${gone.length ? `, ${gone.length} fjernet` : ''}`)
