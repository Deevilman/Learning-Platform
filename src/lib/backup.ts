// Backup reminder: a JSON export of everything, with a weekly reminder that
// can be switched off, and the date of the last backup.

import type { StorageAdapter } from './storage/types'
import { exportAll } from './storage/transfer'

export const BACKUP_LAST_KEY = 'backup.last'
export const BACKUP_REMIND_KEY = 'backup.remind'
const WEEK = 7 * 24 * 60 * 60 * 1000

/** Time for a reminder: never backed up (after the first day of use) or more than a week ago. */
export function backupDue(last: number | null, remind: boolean, firstUse: number | null, now: number): boolean {
  if (!remind) return false
  if (last) return now - last >= WEEK
  return !!firstUse && now - firstUse >= 24 * 60 * 60 * 1000
}

/** Download the export as a file and remember when. */
export async function downloadBackup(store: StorageAdapter): Promise<void> {
  const data = await exportAll(store)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }))
  a.download = `laering-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  await store.put('settings', { id: BACKUP_LAST_KEY, value: Date.now() })
}
