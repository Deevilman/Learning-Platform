// A weekly nudge on the dashboard to save a backup (can be switched off).

import { useEffect } from 'react'
import { useSetting, useStore } from '@/lib/store'
import { BACKUP_LAST_KEY, BACKUP_REMIND_KEY, backupDue, downloadBackup } from '@/lib/backup'
import { dateLocale, useLang, useT } from '@/i18n'

const FIRST_USE_KEY = 'app.firstUse'
const SNOOZE_KEY = 'backup.snoozed'
const DAY = 24 * 60 * 60 * 1000

export function BackupReminder() {
  const t = useT()
  const [lang] = useLang()
  const store = useStore()
  const [last, , l1] = useSetting<number | null>(BACKUP_LAST_KEY, null)
  const [remind, setRemind, l2] = useSetting<boolean>(BACKUP_REMIND_KEY, true)
  const [firstUse, setFirstUse, l3] = useSetting<number | null>(FIRST_USE_KEY, null)
  const [snoozed, setSnoozed, l4] = useSetting<number>(SNOOZE_KEY, 0)
  const loaded = l1 && l2 && l3 && l4
  useEffect(() => {
    if (loaded && !firstUse) setFirstUse(Date.now())
  }, [loaded, firstUse, setFirstUse])
  const now = Date.now()
  if (!loaded || now - snoozed < 3 * DAY || !backupDue(last, remind, firstUse, now)) return null
  return (
    <section className="card-flat flex flex-wrap items-center gap-3" style={{ background: 'var(--warn-soft)' }} role="note">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{t('backup.reminderTitle')}</div>
        <p className="text-sm">
          {t('backup.reminderText')} {last ? t('backup.reminderLast', { date: new Date(last).toLocaleDateString(dateLocale(lang)) }) : t('backup.never')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={() => downloadBackup(store)}>
          {t('backup.save')}
        </button>
        <button className="btn" onClick={() => setSnoozed(now)}>
          {t('backup.later')}
        </button>
        <button className="link text-sm" onClick={() => setRemind(false)}>
          {t('backup.off')}
        </button>
      </div>
    </section>
  )
}
