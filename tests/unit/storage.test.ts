import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { DexieStorage } from '@/lib/storage/dexie'
import { exportAll, importAll } from '@/lib/storage/transfer'
import { TABLES } from '@/lib/storage/types'

let n = 0
const fresh = () => new DexieStorage(`test-${Date.now()}-${n++}`)

async function fill(s: DexieStorage) {
  await s.put('attempts', { id: 'a1', exerciseId: 'quant/3/3.1', course: 'quant', week: 3, topics: ['probability'], difficulty: 2, score: 0.66, rating: 2, source: 'bank', ts: 1 })
  await s.put('answers', { id: 'quant/3/3.1', text: 'Mit svar' })
  await s.put('notes', { id: 'week:quant/3', text: 'Noter' })
  await s.put('checks', { id: 'video:quant/3.1', value: true })
  await s.put('videoIds', { id: 'foundations/1.1/0', youtube: 'dQw4w9WgXcQ' })
  await s.put('logbook', { id: 'l1', date: '2026-10-01', minutes: 90, text: 'God dag' })
  await s.put('srs', { id: 'quant/3/3.1', due: 5, interval: 2, ease: 2.5, reps: 1, lapses: 0, last: 1 })
  await s.put('settings', { id: 'theme', value: 'dark' })
}

describe('storage', () => {
  it('stores, reads, lists and tombstones records', async () => {
    const s = fresh()
    await fill(s)
    expect((await s.get('answers', 'quant/3/3.1'))?.text).toBe('Mit svar')
    await s.delete('answers', 'quant/3/3.1')
    expect(await s.get('answers', 'quant/3/3.1')).toBeUndefined()
    expect((await s.listRaw('answers'))[0].deleted).toBe(true)
    expect(await s.list('answers')).toEqual([])
  })

  it('notifies subscribers on change', async () => {
    const s = fresh()
    const seen: string[] = []
    s.subscribe((t) => seen.push(t))
    await s.put('checks', { id: 'x', value: true })
    expect(seen).toEqual(['checks'])
  })

  it('export → import into a clean profile restores everything', async () => {
    const a = fresh()
    await fill(a)
    const file = JSON.parse(JSON.stringify(await exportAll(a)))
    const b = fresh()
    await importAll(b, file, 'replace')
    for (const t of TABLES) expect(await b.listRaw(t)).toEqual(await a.listRaw(t))
  })

  it('merge keeps the newer version of each record', async () => {
    const a = fresh()
    await a.putRaw('answers', [{ id: 'x', text: 'gammel', updatedAt: 10 }, { id: 'y', text: 'lokal ny', updatedAt: 50 }])
    await importAll(a, { app: 'learning-platform', version: 1, exportedAt: '', tables: { attempts: [], answers: [{ id: 'x', text: 'ny', updatedAt: 20 }, { id: 'y', text: 'importeret gammel', updatedAt: 30 }], notes: [], checks: [], videoIds: [], logbook: [], srs: [], settings: [] } }, 'merge')
    expect((await a.get('answers', 'x'))?.text).toBe('ny')
    expect((await a.get('answers', 'y'))?.text).toBe('lokal ny')
  })

  it('rejects files that are not exports', async () => {
    await expect(importAll(fresh(), { foo: 1 } as never)).rejects.toThrow()
  })
})
