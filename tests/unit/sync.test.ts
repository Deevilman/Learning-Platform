import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { DexieStorage } from '@/lib/storage/dexie'
import { syncWith, type RecordsClient } from '@/lib/storage/supabase-sync'

/** In-memory stand-in for the `records` table (upsert + select … gt … order … range). */
function fakeSupabase(): RecordsClient & { rows: Map<string, any> } {
  const rows = new Map<string, any>()
  // Server clock that only moves forward (like the synced_at trigger).
  let clock = Date.parse('2026-10-01T00:00:00Z')
  return {
    rows,
    from() {
      return {
        upsert: async (batch: any[]) => {
          for (const r of batch) rows.set(`${r.user_id}|${r.tbl}|${r.id}`, { ...r, synced_at: new Date((clock += 1000)).toISOString() })
          return { error: null }
        },
        select: () => {
          let after = ''
          const q = {
            gt: (_: string, v: string) => ((after = v), q),
            order: () => q,
            range: async (from: number, to: number) => ({
              data: [...rows.values()]
                .filter((r) => r.synced_at > after)
                .sort((a, b) => (a.synced_at < b.synced_at ? -1 : 1))
                .slice(from, to + 1),
              error: null,
            }),
          }
          return q
        },
      }
    },
  }
}

let n = 0
const db = () => new DexieStorage(`sync-${Date.now()}-${n++}`)

describe('Supabase sync (against a fake backend)', () => {
  it('moves data between two devices and merges by newest edit', async () => {
    const sb = fakeSupabase()
    const laptop = db()
    const phone = db()

    await laptop.put('answers', { id: 'quant/3/3.1', text: 'fra laptop' })
    await laptop.put('checks', { id: 'video:quant/3.1', value: true })
    expect(await syncWith(laptop, sb, 'u1')).toMatchObject({ pushed: 2 })

    const r = await syncWith(phone, sb, 'u1')
    expect(r.pulled).toBe(2)
    expect((await phone.get('answers', 'quant/3/3.1'))?.text).toBe('fra laptop')
    expect((await phone.get('checks', 'video:quant/3.1'))?.value).toBe(true)

    // Edit on the phone later; the laptop picks it up.
    await new Promise((res) => setTimeout(res, 5))
    await phone.put('answers', { id: 'quant/3/3.1', text: 'rettet på telefonen' })
    await syncWith(phone, sb, 'u1')
    await syncWith(laptop, sb, 'u1')
    expect((await laptop.get('answers', 'quant/3/3.1'))?.text).toBe('rettet på telefonen')
  })

  it('propagates deletions as tombstones', async () => {
    const sb = fakeSupabase()
    const a = db()
    const b = db()
    await a.put('logbook', { id: 'l1', date: '2026-10-01', minutes: 30, text: 'x' })
    await syncWith(a, sb, 'u1')
    await syncWith(b, sb, 'u1')
    expect(await b.get('logbook', 'l1')).toBeDefined()
    await new Promise((res) => setTimeout(res, 5))
    await a.delete('logbook', 'l1')
    await syncWith(a, sb, 'u1')
    await syncWith(b, sb, 'u1')
    expect(await b.get('logbook', 'l1')).toBeUndefined()
  })

  it('picks up an edit made offline earlier but uploaded later', async () => {
    const sb = fakeSupabase()
    const a = db()
    const b = db()
    // A edits first (offline) …
    await a.put('answers', { id: 'offline', text: 'skrevet i toget' })
    await new Promise((res) => setTimeout(res, 5))
    // … B edits something else later and syncs twice, moving its watermark forward …
    await b.put('answers', { id: 'other', text: 'b' })
    await syncWith(b, sb, 'u1')
    await syncWith(b, sb, 'u1')
    // … then A comes online and uploads its older edit.
    await syncWith(a, sb, 'u1')
    await syncWith(b, sb, 'u1')
    expect((await b.get('answers', 'offline'))?.text).toBe('skrevet i toget')
  })

  it('does not overwrite a newer local edit with an older remote one', async () => {
    const sb = fakeSupabase()
    const a = db()
    const b = db()
    await a.put('notes', { id: 'n', text: 'gammel' })
    await syncWith(a, sb, 'u1')
    await new Promise((res) => setTimeout(res, 5))
    await b.put('notes', { id: 'n', text: 'ny lokal' })
    await syncWith(b, sb, 'u1')
    expect((await b.get('notes', 'n'))?.text).toBe('ny lokal')
  })
})
