// npm run flag-hash -- "FLAG{…}"
// Prints the salted hash to put in a challenge's "flag_hash". The flag itself
// never goes into a course file.

import { randomBytes } from 'node:crypto'
import { hashFlag } from '../supabase/functions/flag/logic.ts'

const flag = process.argv.slice(2).join(' ').trim()
if (!flag) {
  console.error('Brug: npm run flag-hash -- "FLAG{…}"')
  process.exit(1)
}
console.log(await hashFlag(flag, randomBytes(8).toString('hex')))
