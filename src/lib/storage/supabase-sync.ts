// Cloud sync via Supabase. Local IndexedDB stays the source of truth; sync
// pushes local records newer than the last push and pulls remote records
// newer than the last pull, merging per record by updatedAt (last write wins).

import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { config } from '@/config'
import { TABLES, type Rec, type StorageAdapter, type TableName } from './types'
import { newer } from './transfer'

let clientPromise: Promise<SupabaseClient> | null = null

export function supabase(): Promise<SupabaseClient> {
  if (!clientPromise)
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(config.supabase.url, config.supabase.anonKey, {
        // HashRouter owns the URL hash; don't let auth parse it.
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'lp-supabase-auth' },
      }),
    )
  return clientPromise
}

export async function getSession(): Promise<Session | null> {
  const sb = await supabase()
  const { data } = await sb.auth.getSession()
  return data.session
}

export async function signIn(email: string, password: string) {
  const sb = await supabase()
  const { error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function signUp(email: string, password: string) {
  const sb = await supabase()
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  return { needsConfirmation: !data.session }
}

export async function signOut() {
  const sb = await supabase()
  await sb.auth.signOut()
}

const SYNC_KEY = 'sync.state'
interface SyncState {
  lastPush: number
  lastPull: number
  lastSync?: number
}

export interface SyncResult {
  pushed: number
  pulled: number
}

const PAGE = 1000

export async function syncNow(store: StorageAdapter): Promise<SyncResult> {
  const sb = await supabase()
  const session = await getSession()
  if (!session) throw new Error('Du er ikke logget ind.')
  const stateRec = await store.get('settings', SYNC_KEY)
  const state: SyncState = (stateRec?.value as SyncState) || { lastPush: 0, lastPull: 0 }
  const startedAt = Date.now()

  // ---- push
  let pushed = 0
  for (const t of TABLES) {
    const recs = (await store.listRaw(t)).filter((r) => r.updatedAt > state.lastPush && !(t === 'settings' && r.id === SYNC_KEY))
    for (let i = 0; i < recs.length; i += 500) {
      const rows = recs.slice(i, i + 500).map((r) => ({ user_id: session.user.id, tbl: t, id: r.id, data: r, updated_at: r.updatedAt, deleted: !!r.deleted }))
      const { error } = await sb.from('records').upsert(rows, { onConflict: 'user_id,tbl,id' })
      if (error) throw new Error(`Upload fejlede: ${error.message}`)
      pushed += rows.length
    }
  }

  // ---- pull
  let pulled = 0
  let from = 0
  const byTable = new Map<TableName, Rec[]>()
  for (;;) {
    const { data, error } = await sb
      .from('records')
      .select('tbl,id,data,updated_at')
      .gt('updated_at', state.lastPull)
      .order('updated_at', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`Download fejlede: ${error.message}`)
    for (const row of data || []) {
      if (!TABLES.includes(row.tbl as TableName)) continue
      const list = byTable.get(row.tbl as TableName) || []
      list.push(row.data as Rec)
      byTable.set(row.tbl as TableName, list)
    }
    if (!data || data.length < PAGE) break
    from += PAGE
  }
  for (const [t, recs] of byTable) {
    const fresh = await newer(store, t, recs)
    await store.putRaw(t, fresh as any)
    pulled += fresh.length
  }

  const maxRemote = Math.max(state.lastPull, ...[...byTable.values()].flat().map((r) => r.updatedAt || 0))
  await store.putRaw('settings', [{ id: SYNC_KEY, value: { lastPush: startedAt, lastPull: maxRemote, lastSync: Date.now() }, updatedAt: 0 }])
  return { pushed, pulled }
}

export async function lastSync(store: StorageAdapter): Promise<number | undefined> {
  const s = await store.get('settings', SYNC_KEY)
  return (s?.value as SyncState | undefined)?.lastSync
}
