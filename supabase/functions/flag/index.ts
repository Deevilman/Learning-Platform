// Supabase Edge Function "flag": checks a challenge's flag on the server.
// Flags exist only as salted hashes (or, in local labs, as an HMAC per
// learner with the secret LAB_FLAG_SECRET). The write-up is only sent back
// once the flag is accepted.
//
// Request:  { mode: 'check', course, challengeId, flag }  →  { correct, writeup? }
//           { mode: 'lab-flag', course, challengeId }       →  { flag }  (local labs with a flag per learner)

import { createClient } from 'npm:@supabase/supabase-js@2'
import YAML from 'npm:yaml@2'
import { checkFlag, flagRateLimited, labFlag, sha256Hex } from './logic.ts'

interface ServerChallenge {
  id: string
  course: string
  flagHash?: string
  perUser?: boolean
  writeup: string
}

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type', 'access-control-allow-methods': 'POST, OPTIONS' }
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

async function loadChallenge(admin: ReturnType<typeof createClient>, userId: string, course: string, id: string): Promise<ServerChallenge | null> {
  const { data } = await admin.from('challenge_flags').select('data').eq('id', id).maybeSingle()
  if (data?.data) return data.data as ServerChallenge
  // the learner's own uploaded course
  const file = await admin.storage.from('courses').download(`${userId}/${course}.md`)
  if (file.error || !file.data) return null
  for (const m of (await file.data.text()).matchAll(/^```challenge\n([\s\S]*?)\n```\s*$/gm)) {
    const c = YAML.parse(m[1])
    if (c?.id === id) return { id, course, flagHash: c.flag_hash, perUser: c.flag_pr_elev === true, writeup: String(c.writeup || '') }
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply({ error: 'Brug POST.' }, 405)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: auth } = await admin.auth.getUser((req.headers.get('authorization') || '').replace(/^Bearer /, ''))
  if (!auth?.user) return reply({ error: 'Log ind for at tjekke flag.' }, 401)
  const userId = auth.user.id
  let body: { mode?: string; course?: string; challengeId?: string; flag?: string }
  try {
    body = await req.json()
  } catch {
    return reply({ error: 'Ugyldig forespørgsel.' }, 400)
  }
  const { mode = 'check', course = '', challengeId = '' } = body
  const challenge = await loadChallenge(admin, userId, course, challengeId)
  if (!challenge) return reply({ error: 'Udfordringen findes ikke.' }, 404)
  const secret = Deno.env.get('LAB_FLAG_SECRET') || ''

  if (mode === 'lab-flag') {
    if (!challenge.perUser || !secret) return reply({ error: 'Denne udfordring har ikke et personligt flag.' }, 400)
    return reply({ flag: await labFlag(secret, userId, challengeId) })
  }

  const since = new Date(Date.now() - 86_400_000).toISOString()
  const { data: tries } = await admin.from('flag_attempts').select('ts').eq('user_id', userId).eq('challenge_id', challengeId).gte('ts', since)
  const limited = flagRateLimited((tries || []).map((t: { ts: string }) => Date.parse(t.ts)), Date.now())
  if (limited) return reply({ error: limited }, 429)
  await admin.from('flag_attempts').insert({ user_id: userId, challenge_id: challengeId })

  const flag = String(body.flag || '').slice(0, 500)
  let correct = false
  if (challenge.perUser) {
    // compare hashes, so the comparison takes the same time whatever was sent
    correct = !!secret && (await sha256Hex(flag.trim())) === (await sha256Hex(await labFlag(secret, userId, challengeId)))
  } else if (challenge.flagHash) correct = await checkFlag(flag, challenge.flagHash)
  if (!correct) return reply({ correct: false })
  await admin.from('challenge_solves').upsert({ user_id: userId, challenge_id: challengeId }, { onConflict: 'user_id,challenge_id' })
  return reply({ correct: true, writeup: challenge.writeup })
})
