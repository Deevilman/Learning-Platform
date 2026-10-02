import Dexie, { type Table } from 'dexie'
import { TABLES, type Rec, type StorageAdapter, type TableName, type Tables } from './types'

class DB extends Dexie {
  constructor(name: string) {
    super(name)
    this.version(1).stores({
      attempts: '&id, exerciseId, ts, updatedAt',
      answers: '&id, updatedAt',
      notes: '&id, updatedAt',
      checks: '&id, updatedAt',
      videoIds: '&id, updatedAt',
      logbook: '&id, date, updatedAt',
      srs: '&id, due, updatedAt',
      settings: '&id, updatedAt',
    })
  }
}

/** IndexedDB storage via Dexie. */
export class DexieStorage implements StorageAdapter {
  private db: DB
  private listeners = new Set<(t: TableName) => void>()

  constructor(name = 'learning-platform') {
    this.db = new DB(name)
  }

  private t(table: TableName): Table<Rec, string> {
    return this.db.table(table)
  }

  private emit(table: TableName) {
    for (const l of this.listeners) l(table)
  }

  async get<T extends TableName>(table: T, id: string) {
    const r = (await this.t(table).get(id)) as Tables[T] | undefined
    return r && !r.deleted ? r : undefined
  }

  async list<T extends TableName>(table: T) {
    return ((await this.t(table).toArray()) as Tables[T][]).filter((r) => !r.deleted)
  }

  async listRaw<T extends TableName>(table: T) {
    return (await this.t(table).toArray()) as Tables[T][]
  }

  async put<T extends TableName>(table: T, rec: Omit<Tables[T], 'updatedAt'> & { updatedAt?: number }) {
    await this.t(table).put({ ...rec, updatedAt: Date.now(), deleted: false } as Rec)
    this.emit(table)
  }

  async putRaw<T extends TableName>(table: T, recs: Tables[T][]) {
    if (!recs.length) return
    await this.t(table).bulkPut(recs as Rec[])
    this.emit(table)
  }

  async delete(table: TableName, id: string) {
    const cur = await this.t(table).get(id)
    await this.t(table).put({ ...(cur || {}), id, updatedAt: Date.now(), deleted: true } as Rec)
    this.emit(table)
  }

  async clear() {
    await Promise.all(TABLES.map((t) => this.t(t).clear()))
    for (const t of TABLES) this.emit(t)
  }

  subscribe(fn: (t: TableName) => void) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }
}
