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
  // Optimistic local state so a controlled checkbox flips immediately.
  const [local, setLocal] = useState<boolean | null>(null)
  useEffect(() => setLocal(null), [rec, id])
  const set = useCallback(
    (value: boolean) => {
      setLocal(value)
      void store.put('checks', { id, value })
    },
    [store, id],
  )
  return [local ?? !!rec?.value, set]
}

/** A persisted setting with a default. */
export function useSetting<V>(key: string, fallback: V): [V, (v: V) => void, boolean] {
  const store = useStore()
  const [rec, loaded] = useRecord('settings', key)
  const set = useCallback((value: V) => void store.put('settings', { id: key, value }), [store, key])
  return [rec ? (rec.value as V) : fallback, set, loaded]
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`)

/** Repetition card for a generator (a skill), e.g. "gen:q-sharpe". */
export const srsGeneratorId = (generatorId: string) => `gen:${generatorId}`

/** Save an attempt and update the spaced-repetition card (bank exercise or generator). */
export async function recordAttempt(store: StorageAdapter, a: Omit<Attempt, 'id' | 'updatedAt' | 'ts'>, rating?: Rating) {
  const now = Date.now()
  await store.put('attempts', { ...a, id: uid(), ts: now })
  if (rating === undefined) return
  // Bank exercises are repeated as themselves; generated ones as a skill (the generator) with new numbers.
  const cardId = a.source === 'bank' ? a.exerciseId : a.generatorId ? srsGeneratorId(a.generatorId) : null
  if (!cardId) return
  const card = (await store.get('srs', cardId)) || newCard(cardId, now)
  await store.put('srs', review(card, rating, now))
}
