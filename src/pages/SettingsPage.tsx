import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSetting, useStore, useTable } from '@/lib/store'
import { exportAll, importAll, validateExport } from '@/lib/storage/transfer'
import { getSession, lastSync, signIn, signOut, signUp, syncNow } from '@/lib/storage/supabase-sync'
import { useTheme, type ThemePref } from '@/components/ThemeToggle'
import { AnswerPrefPicker } from '@/components/AnswerPrefPicker'
import { loadCourse, loadIndex, loadWeek } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="page-title">Indstillinger</h1>
      <ThemeSection />
      <section className="card space-y-2">
        <h2 className="section-title">Opgaver</h2>
        <AnswerPrefPicker />
        <p className="muted text-sm">Gælder i Træn og i ugernes øvelser. "Blandet" skifter mellem at vælge et svar og at skrive det selv.</p>
      </section>
      <SyncSection />
      <BackupSection />
      <MissingVideos />
      <DangerSection />
    </div>
  )
}

function ThemeSection() {
  const [pref, setPref] = useTheme()
  return (
    <section className="card space-y-2">
      <h2 className="section-title">Udseende</h2>
      <div className="flex gap-2" role="radiogroup" aria-label="Tema">
        {(['system', 'light', 'dark'] as ThemePref[]).map((t) => (
          <button key={t} role="radio" aria-checked={pref === t} className="btn" style={pref === t ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined} onClick={() => setPref(t)}>
            {t === 'system' ? 'Følg systemet' : t === 'light' ? 'Lys' : 'Mørk'}
          </button>
        ))}
      </div>
    </section>
  )
}

function SyncSection() {
  const store = useStore()
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
      <h2 className="section-title">Brug Læring på flere enheder</h2>
      <p className="muted text-sm">
        Dine fremskridt gemmes altid på denne enhed. Logger du ind, kan du også fortsætte på din telefon eller en anden computer.
      </p>
      {email === undefined ? (
        <p className="muted text-sm">Tjekker login…</p>
      ) : email ? (
        <div className="space-y-3">
          <p className="text-sm">
            Logget ind som <b>{email}</b>.{' '}
            {last ? `Senest opdateret ${new Date(last).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' })}.` : 'Ikke opdateret endnu.'}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            Hold mine enheder opdateret automatisk
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={() => run(async () => {
              const r = await syncNow(store)
              return r.pushed + r.pulled ? 'Dine enheder er opdateret.' : 'Alt var allerede opdateret.'
            })}>
              {busy ? 'Opdaterer…' : 'Opdatér nu'}
            </button>
            <button className="btn" disabled={busy} onClick={() => run(async () => (await signOut(), 'Du er logget ud. Dine fremskridt på denne enhed er bevaret.'))}>
              Log ud
            </button>
          </div>
        </div>
      ) : (
        <form className="space-y-2" onSubmit={(e) => (e.preventDefault(), run(async () => (await signIn(form.email, form.password), 'Du er logget ind.')))}>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" type="email" autoComplete="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required aria-label="E-mail" />
            <input className="input" type="password" autoComplete="current-password" placeholder="Adgangskode (mindst 6 tegn)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} aria-label="Adgangskode" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Log ind
            </button>
            <button
              className="btn"
              type="button"
              disabled={busy || !form.email || form.password.length < 6}
              onClick={() =>
                run(async () => {
                  const r = await signUp(form.email, form.password)
                  return r.needsConfirmation ? 'Konto oprettet. Bekræft din e-mail via linket i mailen, og log så ind her.' : 'Konto oprettet og logget ind.'
                })
              }
            >
              Opret konto
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
        if (await getSession()) await syncNow(store)
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
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <section className="card space-y-3">
      <h2 className="section-title">Sikkerhedskopi</h2>
      <p className="muted text-sm">
        Gem alle dine fremskridt i en fil — svar, noter, sete videoer, logbog og indstillinger. Du kan hente filen ind igen senere eller på en anden enhed.
      </p>
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
          Gem sikkerhedskopi
        </button>
        <select className="input w-auto" value={mode} onChange={(e) => setMode(e.target.value as 'merge' | 'replace')} aria-label="Når du henter en kopi">
          <option value="merge">Læg sammen med det, der er her</option>
          <option value="replace">Erstat det, der er her</option>
        </select>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Hent sikkerhedskopi…
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
              if (!validateExport(data)) throw new Error('Filen er ikke en sikkerhedskopi fra Læring.')
              if (mode === 'replace' && !confirm('Erstat alle dine fremskridt på denne enhed med indholdet af filen?')) return
              const n = await importAll(store, data, mode)
              setMsg({ ok: true, text: `Sikkerhedskopien er hentet (${n} ting).` })
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
      <h2 className="section-title">Videoer, vi mangler ({data ? missing.length : '…'})</h2>
      <p className="muted text-sm">Finder du en af dem på YouTube, kan du indsætte linket direkte på ugens side.</p>
      {missing.length > 0 && (
        <ul className="max-h-72 space-y-1 overflow-auto text-sm">
          {missing.map((m) => (
            <li key={`${m.course}/${m.item}/${m.index}`}>
              <Link className="link" to={`/kursus/${m.course}/uge/${m.week}#video-${m.item}`}>
                {m.title} · uge {m.week}
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
  return (
    <section className="card space-y-2" style={{ borderColor: 'var(--bad)' }}>
      <h2 className="section-title">Nulstil</h2>
      <p className="muted text-sm">Sletter alle dine fremskridt på denne enhed. Gem en sikkerhedskopi først, hvis du vil kunne fortryde.</p>
      <button className="btn" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick={() => confirm('Slet alle dine fremskridt på denne enhed? Det kan ikke fortrydes.') && store.clear()}>
        Slet alle fremskridt
      </button>
    </section>
  )
}
