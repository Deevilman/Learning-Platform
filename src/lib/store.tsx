// App-wide storage instance and React hooks.

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { DexieStorage } from './storage/dexie'
import type { StorageAdapter, TableName, Tables, Attempt, Rating } from './storage/types'
import { newCard, review } from './srs'

const StoreCtx = createContext<StorageAdapter | null>(null)

let defaultStore: StorageAdapter | null = null
export function getStore(): StorageAdapter {
  if (!defaultStore) defaultStore = new DexieStorage()
  return defaultStore
}

export function StoreProvider({ store, children }: { store?: StorageAdapter; children: ReactNode }) {
  return <StoreCtx.Provider value={store || getStore()}>{children}</StoreCtx.Provider>
}

export function useStore(): StorageAdapter {
  return useContext(StoreCtx) || getStore()
}

/** Live list of a table; re-queries when the table changes. */
export function useTable<T extends TableName>(table: T): Tables[T][] | undefined {
  const store = useStore()
  const [rows, setRows] = useState<Tables[T][]>()
  useEffect(() => {
    let alive = true
    const load = () => store.list(table).then((r) => alive && setRows(r))
    load()
    const off = store.subscribe((t) => t === table && load())
    return () => {
      alive = false
      off()
    }
  }, [store, table])
  return rows
}

/** Live single record. */
export function useRecord<T extends TableName>(table: T, id: string): [Tables[T] | undefined | null, boolean] {
  const store = useStore()
  const [rec, setRec] = useState<Tables[T] | undefined | null>(null)
  useEffect(() => {
    let alive = true
    setRec(null)
    const load = () => store.get(table, id).then((r) => alive && setRec(r))
    load()
    const off = store.subscribe((t) => t === table && load())
    return () => {
      alive = false
      off()
    }
  }, [store, table, id])
  return [rec, rec !== null]
}

/** A persisted boolean (checkbox). */
export function useCheck(id: string): [boolean, (v: boolean) => void] {
  const store = useStore()
  const [rec] = useRecord('checks', id)
  const set = useCallback((value: boolean) => void store.put('checks', { id, value }), [store, id])
  return [!!rec?.value, set]
}

/** A persisted setting with a default. */
export function useSetting<V>(key: string, fallback: V): [V, (v: V) => void, boolean] {
  const store = useStore()
  const [rec, loaded] = useRecord('settings', key)
  const set = useCallback((value: V) => void store.put('settings', { id: key, value }), [store, key])
  return [rec ? (rec.value as V) : fallback, set, loaded]
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`)

/** Save an attempt and (for bank exercises) update the spaced-repetition card. */
export async function recordAttempt(store: StorageAdapter, a: Omit<Attempt, 'id' | 'updatedAt' | 'ts'>, rating?: Rating) {
  const now = Date.now()
  await store.put('attempts', { ...a, id: uid(), ts: now })
  if (a.source === 'bank' && rating !== undefined) {
    const card = (await store.get('srs', a.exerciseId)) || newCard(a.exerciseId, now)
    await store.put('srs', review(card, rating, now))
  }
}
