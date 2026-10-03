import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSetting, useStore, useTable } from '@/lib/store'
import { exportAll, importAll, validateExport } from '@/lib/storage/transfer'
import { getSession, lastSync, signIn, signOut, signUp, syncNow } from '@/lib/storage/supabase-sync'
import { useTheme, type ThemePref } from '@/components/ThemeToggle'
import { syncCourses } from '@/lib/courses/cloud'
import { AnswerPrefPicker } from '@/components/AnswerPrefPicker'
import { DailyGoalSettings } from '@/components/DailyGoal'
import { loadCourse, loadIndex, loadWeek } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { dateLocale, LANGS, useLang, useT } from '@/i18n'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SettingsTitle />
      <LanguageSection />
      <ThemeSection />
      <ExerciseSection />
      <SyncSection />
      <BackupSection />
      <MissingVideos />
      <DangerSection />
    </div>
  )
}

function ExerciseSection() {
  const t = useT()
  return (
    <>
      <section className="card space-y-2">
        <h2 className="section-title">{t('settings.exercises')}</h2>
        <AnswerPrefPicker />
        <p className="muted text-sm">{t('settings.exercisesIntro')}</p>
      </section>
      <section className="card space-y-2">
        <h2 className="section-title">{t('settings.dailyGoal')}</h2>
        <DailyGoalSettings />
      </section>
    </>
  )
}

function SettingsTitle() {
  const t = useT()
  return <h1 className="page-title">{t('nav.settings')}</h1>
}

function LanguageSection() {
  const t = useT()
  const [lang, setLang] = useLang()
  return (
    <section className="card space-y-2">
      <h2 className="section-title">{t('lang.label')}</h2>
      <div className="flex gap-2" role="radiogroup" aria-label={t('lang.label')}>
        {LANGS.map((l) => (
          <button key={l} role="radio" lang={l} aria-checked={lang === l} className="btn" style={lang === l ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined} onClick={() => setLang(l)}>
            {t(l === 'da' ? 'lang.da' : 'lang.en')}
          </button>
        ))}
      </div>
      <p className="muted text-sm">{t('lang.intro')}</p>
    </section>
  )
}

function ThemeSection() {
  const t = useT()
  const [pref, setPref] = useTheme()
  return (
    <section className="card space-y-2">
      <h2 className="section-title">{t('settings.look')}</h2>
      <div className="flex gap-2" role="radiogroup" aria-label={t('settings.theme')}>
        {(['system', 'light', 'dark'] as ThemePref[]).map((p) => (
          <button key={p} role="radio" aria-checked={pref === p} className="btn" style={pref === p ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined} onClick={() => setPref(p)}>
            {p === 'system' ? t('settings.themeSystem') : p === 'light' ? t('settings.themeLight') : t('settings.themeDark')}
          </button>
        ))}
      </div>
    </section>
  )
}

function SyncSection() {
  const store = useStore()
  const t = useT()
  const [lang] = useLang()
  const [email, setEmail] = useState<string | null | undefined>(undefined)
  const [form, setForm] = useState({ email: '', password: '' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<number | undefined>()
  const [auto, setAuto] = useSetting('sync.auto', true)

  useEffect(() => {
    getSession().then((s) => setEmail(s?.user.email ?? null), () => setEmail(null))
    lastSync(store).then(setLast)
  }, [store])

  async function run(fn: () => Promise<string>) {
    setBusy(true)
    setMsg(null)
    try {
      setMsg({ ok: true, text: await fn() })
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    } finally {
      setBusy(false)
      getSession().then((s) => setEmail(s?.user.email ?? null))
      lastSync(store).then(setLast)
    }
  }

  return (
    <section className="card space-y-3">
      <h2 className="section-title">{t('sync.title')}</h2>
      <p className="muted text-sm">{t('sync.intro')}</p>
      {email === undefined ? (
        <p className="muted text-sm">{t('sync.checking')}</p>
      ) : email ? (
        <div className="space-y-3">
          <p className="text-sm">
            {t('sync.loggedInAs')} <b>{email}</b>.{' '}
            {last ? t('sync.lastUpdated', { when: new Date(last).toLocaleString(dateLocale(lang), { dateStyle: 'short', timeStyle: 'short' }) }) : t('sync.notYet')}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            {t('sync.auto')}
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={() => run(async () => {
              const r = await syncNow(store)
              await syncCourses().catch(() => null)
              return r.pushed + r.pulled ? t('sync.updated') : t('sync.upToDate')
            })}>
              {busy ? t('sync.updating') : t('sync.updateNow')}
            </button>
            <button className="btn" disabled={busy} onClick={() => run(async () => (await signOut(), t('sync.loggedOut')))}>
              {t('sync.logOut')}
            </button>
          </div>
        </div>
      ) : (
        <form className="space-y-2" onSubmit={(e) => (e.preventDefault(), run(async () => (await signIn(form.email, form.password), t('sync.loggedIn'))))}>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" type="email" autoComplete="email" placeholder={t('sync.email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required aria-label={t('sync.email')} />
            <input className="input" type="password" autoComplete="current-password" placeholder={t('sync.passwordHint')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} aria-label={t('sync.password')} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {t('sync.logIn')}
            </button>
            <button
              className="btn"
              type="button"
              disabled={busy || !form.email || form.password.length < 6}
              onClick={() =>
                run(async () => {
                  const r = await signUp(form.email, form.password)
                  return r.needsConfirmation ? t('sync.createdConfirm') : t('sync.created')
                })
              }
            >
              {t('sync.createAccount')}
            </button>
          </div>
        </form>
      )}
      {msg && (
        <p role="status" className="text-sm" style={{ color: msg.ok ? 'var(--ok)' : 'var(--bad)' }}>
          {msg.text}
        </p>
      )}
    </section>
  )
}

/** Background sync while logged in (mounted once in App). */
export function AutoSync() {
  const store = useStore()
  const [auto, , loaded] = useSetting('sync.auto', true)
  const busy = useRef(false)
  useEffect(() => {
    if (!loaded || !auto) return
    let stopped = false
    const tick = async () => {
      if (busy.current || stopped) return
      busy.current = true
      try {
        if (await getSession()) {
          await syncNow(store)
          await syncCourses().catch(() => null)
        }
      } catch {
        /* offline or not configured — try again later */
      } finally {
        busy.current = false
      }
    }
    const first = setTimeout(tick, 2000)
    const timer = setInterval(tick, 5 * 60 * 1000)
    const onHide = () => document.visibilityState === 'hidden' && tick()
    document.addEventListener('visibilitychange', onHide)
    return () => {
      stopped = true
      clearTimeout(first)
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [auto, loaded, store])
  return null
}

function BackupSection() {
  const store = useStore()
  const t = useT()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <section className="card space-y-3">
      <h2 className="section-title">{t('backup.title')}</h2>
      <p className="muted text-sm">{t('backup.intro')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn btn-primary"
          onClick={async () => {
            const data = await exportAll(store)
            const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `laering-backup-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            setTimeout(() => URL.revokeObjectURL(a.href), 1000)
          }}
        >
          {t('backup.save')}
        </button>
        <select className="input w-auto" value={mode} onChange={(e) => setMode(e.target.value as 'merge' | 'replace')} aria-label={t('backup.modeLabel')}>
          <option value="merge">{t('backup.merge')}</option>
          <option value="replace">{t('backup.replace')}</option>
        </select>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          {t('backup.load')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              const data = JSON.parse(await f.text())
              if (!validateExport(data)) throw new Error(t('backup.notBackup'))
              if (mode === 'replace' && !confirm(t('backup.confirmReplace'))) return
              const n = await importAll(store, data, mode)
              setMsg({ ok: true, text: t('backup.loaded', { n }) })
            } catch (err) {
              setMsg({ ok: false, text: (err as Error).message })
            }
          }}
        />
      </div>
      {msg && (
        <p role="status" className="text-sm" style={{ color: msg.ok ? 'var(--ok)' : 'var(--bad)' }}>
          {msg.text}
        </p>
      )}
    </section>
  )
}

function MissingVideos() {
  const t = useT()
  const overrides = useTable('videoIds')
  const { data } = useAsync(async () => {
    const idx = await loadIndex()
    const out: { course: string; title: string; week: number; item: string; index: number; label: string }[] = []
    for (const c of idx.courses) {
      const course = await loadCourse(c.slug)
      if (!course.counts.videosMissing) continue
      for (const w of course.weeks) {
        const week = await loadWeek(c.slug, w.number)
        for (const v of week.videos)
          v.sources.forEach((s, i) => {
            if (!s.youtube && s.search) out.push({ course: c.slug, title: c.title, week: w.number, item: v.id, index: i, label: s.title })
          })
      }
    }
    return out
  }, [])
  const filled = new Set((overrides || []).map((o) => o.id))
  const missing = (data || []).filter((m) => !filled.has(`${m.course}/${m.item}/${m.index}`))
  return (
    <section className="card space-y-2">
      <h2 className="section-title">{t('missing.title', { n: data ? missing.length : '…' })}</h2>
      <p className="muted text-sm">{t('missing.intro')}</p>
      {missing.length > 0 && (
        <ul className="max-h-72 space-y-1 overflow-auto text-sm">
          {missing.map((m) => (
            <li key={`${m.course}/${m.item}/${m.index}`}>
              <Link className="link" to={`/kursus/${m.course}/uge/${m.week}#video-${m.item}`}>
                {m.title} · {t('missing.week', { n: m.week })}
              </Link>
              : {m.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DangerSection() {
  const store = useStore()
  const t = useT()
  return (
    <section className="card space-y-2" style={{ borderColor: 'var(--bad)' }}>
      <h2 className="section-title">{t('reset.title')}</h2>
      <p className="muted text-sm">{t('reset.intro')}</p>
      <button className="btn" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick={() => confirm(t('reset.confirm')) && store.clear()}>
        {t('reset.button')}
      </button>
    </section>
  )
}
