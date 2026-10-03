// Proof that nothing secret ended up in what is served to browsers: no flag
// (any FLAG{…} in the files is hashed and compared with the real flag
// hashes), no flag hash or salt, no write-up, no hidden test and no reference
// solution.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { ServerChallenge } from './challenges.ts'
import type { ServerProblem } from './problems.ts'
import { checkFlag } from '../../supabase/functions/flag/logic.ts'

function* files(dir: string): Generator<string> {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) yield* files(p)
    else if (/\.(js|mjs|json|html|css|txt|md|map|svg)$/.test(f)) yield p
  }
}

const snippet = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, 60)

export async function findSecrets(dir: string, challenges: ServerChallenge[], problems: ServerProblem[]): Promise<string[]> {
  const found: string[] = []
  const needles: [string, string][] = []
  for (const c of challenges) {
    if (c.flagHash) {
      const [, salt, hash] = c.flagHash.split(':')
      needles.push([hash, `flag-hash for ${c.id}`], [salt, `salt for ${c.id}`])
    }
    if (snippet(c.writeup).length >= 30) needles.push([snippet(c.writeup), `write-up for ${c.id}`])
  }
  for (const p of problems) {
    for (const t of p.hiddenTests) if (t.input.trim().length >= 12) needles.push([t.input.trim(), `skjult test i ${p.id}`])
    const ref = p.reference.code.trim().split('\n').find((l) => l.trim().length >= 25)
    if (ref) needles.push([ref.trim(), `referenceløsning i ${p.id}`])
  }
  for (const f of files(dir)) {
    const text = readFileSync(f, 'utf8')
    const flat = text.replace(/\s+/g, ' ')
    for (const [n, what] of needles) if (text.includes(n) || flat.includes(n)) found.push(`${relative(dir, f)}: ${what}`)
    for (const m of text.matchAll(/FLAG\{[^}\s"'`]{1,120}\}/g))
      for (const c of challenges) if (c.flagHash && (await checkFlag(m[0], c.flagHash))) found.push(`${relative(dir, f)}: flaget til ${c.id}`)
  }
  return [...new Set(found)]
}
