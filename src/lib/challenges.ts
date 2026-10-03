// Challenges from the app's side: the flag is checked by the Edge Function
// "flag"; a solved challenge and its write-up are kept with the learner's
// other progress (synced). The ethics gate is a setting.

import { getSession, supabase } from './storage/supabase-sync'
import { tr } from '@/i18n/translate'

export const ETHICS_KEY = 'ethics.accepted'
export const solvedId = (id: string) => `challenge:${id}`
export const writeupId = (id: string) => `writeup:${id}`
export const needsEthicsGate = (env: string) => env === 'local-lab' || env === 'external'

async function call<T>(body: Record<string, string>): Promise<T | { error: string }> {
  const session = await getSession().catch(() => null)
  if (!session) return { error: tr('ctf.login') }
  const sb = await supabase()
  const { data, error } = await sb.functions.invoke('flag', { body })
  if (error) {
    const ctx = (error as { context?: Response }).context
    const msg = ctx && typeof ctx.json === 'function' ? await ctx.json().then((j: { error?: string }) => j.error).catch(() => null) : null
    return { error: msg || tr('ctf.unavailable') }
  }
  return data as T
}

export const checkChallengeFlag = (course: string, challengeId: string, flag: string) => call<{ correct: boolean; writeup?: string }>({ mode: 'check', course, challengeId, flag })
export const myLabFlag = (course: string, challengeId: string) => call<{ flag: string }>({ mode: 'lab-flag', course, challengeId })
