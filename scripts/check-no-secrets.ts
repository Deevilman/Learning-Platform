// CI step after `vite build`: fail if a flag, flag hash, write-up, hidden test
// or reference solution is in dist/ (what GitHub Pages serves).

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findSecrets } from './lib/bundle-secrets.ts'

const root = join(import.meta.dirname, '..')
const read = (f: string) => (existsSync(join(root, '.judge', f)) ? JSON.parse(readFileSync(join(root, '.judge', f), 'utf8')) : [])
const dir = join(root, process.argv[2] || 'dist')
const found = await findSecrets(dir, read('challenges.json'), read('problems.json'))
if (found.length) {
  console.error('✗ Hemmeligheder i det, der sendes til browseren:\n' + found.map((f) => `  - ${f}`).join('\n'))
  process.exit(1)
}
console.log(`✓ Ingen flag, write-ups, skjulte tests eller referenceløsninger i ${process.argv[2] || 'dist'}/`)
