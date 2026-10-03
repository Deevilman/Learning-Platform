import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { backupDue } from '@/lib/backup'

const schema = readFileSync(join(import.meta.dirname, '../../supabase/schema.sql'), 'utf8')
const DAY = 86_400_000

describe('Supabase schema', () => {
  it('records_touch has an empty search_path', () => {
    expect(schema).toMatch(/function public\.records_touch\(\)[^$]*set search_path = ''/)
  })
  it('every policy uses (select auth.uid())', () => {
    const policies = schema.split('\n').filter((l) => /create policy/.test(l) || /^\s+(using|with check)/.test(l))
    for (const l of policies) expect(l, l).not.toMatch(/(?<!select )auth\.uid\(\)/)
    expect(policies.join('\n')).toContain('(select auth.uid())')
  })
  it('rls_auto_enable() is revoked from public, anon and authenticated, guarded with if exists', () => {
    expect(schema).toMatch(/if exists \(select 1 from pg_proc[^)]*rls_auto_enable/)
    expect(schema).toContain('revoke execute on function public.rls_auto_enable() from public, anon, authenticated')
  })
  it('has the courses table with RLS and the storage policies', () => {
    expect(schema).toContain('create table if not exists public.courses')
    expect(schema).toContain('alter table public.courses enable row level security')
    expect(schema).toMatch(/on storage\.objects for (select|insert|update|delete)/)
  })
  it('the judge and flag tables have RLS and no policies for secrets', () => {
    for (const t of ['problem_tests', 'judge_usage', 'challenge_flags', 'flag_attempts']) {
      expect(schema).toContain(`alter table public.${t} enable row level security`)
      expect(schema).not.toMatch(new RegExp(`create policy [^;]* on public\\.${t}\\b`))
    }
  })
})

describe('backup reminder', () => {
  const now = 100 * DAY
  it('weekly, and not on the very first day', () => {
    expect(backupDue(null, true, now - 2 * 3600_000, now)).toBe(false)
    expect(backupDue(null, true, now - 2 * DAY, now)).toBe(true)
    expect(backupDue(now - 3 * DAY, true, now - 30 * DAY, now)).toBe(false)
    expect(backupDue(now - 8 * DAY, true, now - 30 * DAY, now)).toBe(true)
    expect(backupDue(now - 8 * DAY, false, now - 30 * DAY, now)).toBe(false)
  })
})
