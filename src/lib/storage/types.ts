// Storage contract. Every record is keyed by a string id and carries
// updatedAt (ms) so that export/import and cloud sync can merge by
// last-write-wins. Deletions are tombstones (deleted: true).

import type { Difficulty } from '@/types/content'

export interface Rec {
  id: string
  updatedAt: number
  deleted?: boolean
}

export type Rating = 0 | 1 | 2 | 3 // Kunne ikke · Delvist · Kunne med hint · Kunne

export interface Attempt extends Rec {
  exerciseId: string // bank id ("quant/3/3.5") or "gen:<generatorId>:<seed>:<difficulty>"
  course: string
  week: number
  topics: string[]
  difficulty: Difficulty
  score: number // 0..1
  rating?: Rating
  auto?: boolean // graded by an AutoCheck
  source: 'bank' | 'generated'
  generatorId?: string
  seed?: number
  answer?: string
  ts: number
}

export interface TextRec extends Rec {
  text: string
}

export interface CheckRec extends Rec {
  value: boolean
}

export interface VideoIdRec extends Rec {
  youtube: string
}

export interface LogEntry extends Rec {
  date: string // YYYY-MM-DD
  course?: string
  week?: number
  minutes: number
  text: string
}

export interface SrsRec extends Rec {
  due: number // ms timestamp
  interval: number // days
  ease: number
  reps: number
  lapses: number
  last: number
}

export interface SettingRec extends Rec {
  value: unknown
}

export interface Tables {
  attempts: Attempt
  answers: TextRec // id = exercise id
  notes: TextRec // id = exercise id or "week:<course>/<n>"
  checks: CheckRec // id = "video:<course>/<itemId>" | "checkpoint:<course>/<week>/<i>" | "project:<course>/<part>/<i>"
  videoIds: VideoIdRec // id = "<course>/<itemId>/<sourceIndex>"
  logbook: LogEntry
  srs: SrsRec // id = bank exercise id
  settings: SettingRec // id = setting key
}

export type TableName = keyof Tables
export const TABLES: TableName[] = ['attempts', 'answers', 'notes', 'checks', 'videoIds', 'logbook', 'srs', 'settings']

export interface ExportFile {
  app: 'learning-platform'
  version: 1
  exportedAt: string
  tables: { [K in TableName]: Tables[K][] }
}

export interface StorageAdapter {
  get<T extends TableName>(table: T, id: string): Promise<Tables[T] | undefined>
  /** Live records (tombstones excluded). */
  list<T extends TableName>(table: T): Promise<Tables[T][]>
  /** All records including tombstones (used by sync/export). */
  listRaw<T extends TableName>(table: T): Promise<Tables[T][]>
  put<T extends TableName>(table: T, rec: Omit<Tables[T], 'updatedAt'> & { updatedAt?: number }): Promise<void>
  /** Write records as-is (keeps their updatedAt). Used by import and sync. */
  putRaw<T extends TableName>(table: T, recs: Tables[T][]): Promise<void>
  delete(table: TableName, id: string): Promise<void>
  clear(): Promise<void>
  subscribe(fn: (table: TableName) => void): () => void
}
