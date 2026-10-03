// JSON export/import of everything in storage.

import { TABLES, type ExportFile, type Rec, type StorageAdapter, type TableName } from './types'
import { tr } from '@/i18n/translate'

export async function exportAll(store: StorageAdapter): Promise<ExportFile> {
  const tables = {} as ExportFile['tables']
  for (const t of TABLES) (tables as any)[t] = await store.listRaw(t)
  return { app: 'learning-platform', version: 1, exportedAt: new Date().toISOString(), tables }
}

export function validateExport(data: any): data is ExportFile {
  return !!data && data.app === 'learning-platform' && data.version === 1 && typeof data.tables === 'object'
}

/**
 * Merge records into storage. 'replace' wipes local data first; 'merge'
 * keeps whichever version of each record is newer (last write wins).
 */
export async function importAll(store: StorageAdapter, data: ExportFile, mode: 'replace' | 'merge' = 'merge') {
  if (!validateExport(data)) throw new Error(tr('backup.notBackup'))
  if (mode === 'replace') await store.clear()
  let count = 0
  for (const t of TABLES) {
    const incoming = ((data.tables as any)[t] || []) as Rec[]
    if (!incoming.length) continue
    const recs = mode === 'replace' ? incoming : await newer(store, t, incoming)
    await store.putRaw(t, recs as any)
    count += recs.length
  }
  return count
}

/** Records from `incoming` that are newer than (or missing from) local storage. */
export async function newer(store: StorageAdapter, table: TableName, incoming: Rec[]): Promise<Rec[]> {
  const local = new Map((await store.listRaw(table)).map((r) => [r.id, r]))
  return incoming.filter((r) => {
    const l = local.get(r.id)
    return !l || (r.updatedAt || 0) > (l.updatedAt || 0)
  })
}
