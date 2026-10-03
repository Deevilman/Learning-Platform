// "Udfordringer": CTF-style challenges from the courses. Nothing here attacks
// anyone: analysis tasks, reviewed files, a sandbox in the browser with no
// network, labs on your own machine, and links to legal training platforms.

import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useCheck, useSetting, useStore, useTable } from '@/lib/store'
import { checkChallengeFlag, ETHICS_KEY, myLabFlag, needsEthicsGate, solvedId, writeupId } from '@/lib/challenges'
import { miniMarkdown } from '@/lib/mini-md'
import { Html } from '@/components/Html'
import { STARS } from '@/components/ExerciseCard'
import { Crumbs, ErrorBox, Loading } from '@/components/ui'
import { useT, type Key } from '@/i18n'
import type { Challenge, ChallengeEnv } from '@/types/content'

export const ENV_KEY: Record<ChallengeEnv, Key> = { none: 'ctf.env.none', files: 'ctf.env.files', 'browser-sandbox': 'ctf.env.sandbox', 'local-lab': 'ctf.env.lab', external: 'ctf.env.external' }
const href = (c: Pick<Challenge, 'id'>) => `/udfordringer/opgave?id=${encodeURIComponent(c.id)}`

function useChallenges() {
  return useAsync(async () => {
    const idx = await loadIndex()
    const courses = await Promise.all(idx.courses.map((c) => loadCourse(c.slug)))
    return courses.filter((c) => c.challenges?.length).map((c) => ({ slug: c.meta.slug, title: c.meta.title, challenges: c.challenges! }))
  }, [])
}

export default function ChallengesPage() {
  const t = useT()
  const { data, error } = useChallenges()
  const checks = useTable('checks')
  if (error) return <ErrorBox error={error} />
  if (!data || !checks) return <Loading />
  const solved = new Set(checks.filter((c) => c.value && c.id.startsWith('challenge:')).map((c) => c.id.slice('challenge:'.length)))
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="page-title">{t('nav.ctf')}</h1>
        <p className="muted">{t('ctf.intro')}</p>
      </div>
      {!data.length && <p className="card muted">{t('ctf.none')}</p>}
      {data.map((c) => (
        <section key={c.slug} className="space-y-2">
          <h2 className="section-title">{c.title}</h2>
          <ul className="space-y-2">
            {c.challenges.map((ch) => (
              <li key={ch.id}>
                <Link to={href(ch)} className="card flex flex-wrap items-center gap-3 hover:shadow-md">
                  {solved.has(ch.id) && <span className="chip" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>{t('code.solved')}</span>}
                  <span className="min-w-0 flex-1 font-medium">{ch.title}</span>
                  <span className="chip text-xs">{t(ENV_KEY[ch.env])}</span>
                  <span style={{ color: 'var(--warn)' }}>{STARS[ch.difficulty]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function ChallengePage() {
  const t = useT()
  const [params] = useSearchParams()
  const id = params.get('id') || ''
  const { data, error } = useChallenges()
  const [accepted, setAccepted, loaded] = useSetting<boolean>(ETHICS_KEY, false)
  if (error) return <ErrorBox error={error} />
  if (!data || !loaded) return <Loading />
  const course = data.find((c) => c.challenges.some((x) => x.id === id))
  const ch = course?.challenges.find((x) => x.id === id)
  if (!course || !ch) return <p>{t('notFound.title')}.</p>
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Crumbs items={[{ to: '/udfordringer', label: t('nav.ctf') }, { label: ch.title }]} />
      <header className="space-y-1">
        <h1 className="page-title">{ch.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span style={{ color: 'var(--warn)' }}>{STARS[ch.difficulty]}</span>
          <span className="chip">{t(ENV_KEY[ch.env])}</span>
          <span className="muted">{course.title}</span>
        </div>
      </header>
      {needsEthicsGate(ch.env) && !accepted ? <EthicsGate onAccept={() => setAccepted(true)} /> : <Body ch={ch} />}
    </div>
  )
}

function EthicsGate({ onAccept }: { onAccept: () => void }) {
  const t = useT()
  const [ok, setOk] = useState(false)
  return (
    <section className="card space-y-3" style={{ borderColor: 'var(--warn)' }} aria-labelledby="ethics-h">
      <h2 id="ethics-h" className="section-title">
        {t('ctf.ethicsTitle')}
      </h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>{t('ctf.ethics1')}</li>
        <li>{t('ctf.ethics2')}</li>
        <li>{t('ctf.ethics3')}</li>
      </ul>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        {t('ctf.ethicsAccept')}
      </label>
      <button className="btn btn-primary" disabled={!ok} onClick={onAccept}>
        {t('ctf.ethicsContinue')}
      </button>
    </section>
  )
}

function Body({ ch }: { ch: Challenge }) {
  const t = useT()
  const store = useStore()
  const [solved, setSolved] = useCheck(solvedId(ch.id))
  const [writeup, setWriteup] = useState<string | null>(null)
  const [flag, setFlag] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [hints, setHints] = useState(0)
  useEffect(() => {
    store.get('notes', writeupId(ch.id)).then((r) => setWriteup(r?.text || null))
  }, [store, ch.id])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!flag.trim()) return
    setBusy(true)
    setMsg(null)
    const r = await checkChallengeFlag(ch.course, ch.id, flag)
    setBusy(false)
    if ('error' in r) return setMsg({ ok: false, text: r.error })
    if (!r.correct) return setMsg({ ok: false, text: t('ctf.wrong') })
    setSolved(true)
    setMsg({ ok: true, text: t('ctf.right') })
    if (r.writeup) {
      setWriteup(r.writeup)
      await store.put('notes', { id: writeupId(ch.id), text: r.writeup })
    }
  }

  return (
    <>
      <Html html={ch.statementHtml} className="card reading" />
      <EnvPanel ch={ch} />
      {ch.flagChecked && (
        <section className="card space-y-2">
          <h2 className="section-title">{t('ctf.flag')}</h2>
          {solved ? (
            <p style={{ color: 'var(--ok)' }}>✓ {t('ctf.solved')}</p>
          ) : (
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
              <input className="input font-mono" value={flag} onChange={(e) => setFlag(e.target.value)} placeholder="FLAG{…}" aria-label={t('ctf.flag')} autoComplete="off" />
              <button className="btn btn-primary shrink-0" type="submit" disabled={busy || !flag.trim()}>
                {busy ? t('ctf.checking') : t('ctf.check')}
              </button>
            </form>
          )}
          {msg && (
            <p role="status" className="text-sm" style={{ color: msg.ok ? 'var(--ok)' : 'var(--text)' }}>
              {msg.text}
            </p>
          )}
        </section>
      )}
      <section className="card space-y-3">
        {ch.hintsHtml.slice(0, hints).map((h, i) => (
          <div key={i} className="fade-in rounded-xl p-3" style={{ background: 'var(--warn-soft)' }}>
            <div className="mb-1 text-sm font-semibold">{t('exercise.hintOf', { n: i + 1, total: ch.hintsHtml.length })}</div>
            <Html html={h} />
          </div>
        ))}
        {hints < ch.hintsHtml.length && (
          <button className="btn" onClick={() => setHints(hints + 1)}>
            💡 {hints ? t('exercise.nextHint') : t('exercise.showHint')}
          </button>
        )}
        {writeup ? (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)' }}>
            <div className="mb-1 text-sm font-semibold">{t('ctf.writeup')}</div>
            <Html html={miniMarkdown(writeup)} />
          </div>
        ) : (
          ch.flagChecked && <p className="muted text-xs">{t('ctf.writeupLater')}</p>
        )}
      </section>
    </>
  )
}

/** The environment: files to download, a sandbox with no network, a local lab, or an external platform. */
function EnvPanel({ ch }: { ch: Challenge }) {
  const t = useT()
  if (ch.env === 'files' && ch.files)
    return (
      <section className="card space-y-2">
        <h2 className="section-title">{t('ctf.files')}</h2>
        <ul className="flex flex-wrap gap-2">
          {ch.files.map((f) => (
            <li key={f.name}>
              <button className="btn font-mono" onClick={() => download(f.name, f.content)}>
                ⬇ {f.name}
              </button>
            </li>
          ))}
        </ul>
      </section>
    )
  if (ch.env === 'browser-sandbox' && ch.sandbox) return <Sandbox html={ch.sandbox} />
  if (ch.env === 'local-lab' && ch.lab) return <Lab ch={ch} />
  if (ch.env === 'external' && ch.external) return <External ch={ch} />
  return null
}

// No network for the page inside: the sandbox has its own origin (no allow-same-origin) and a CSP that blocks every request.
const CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:">`

function Sandbox({ html }: { html: string }) {
  const t = useT()
  const doc = useMemo(() => (/<head>/i.test(html) ? html.replace(/<head>/i, `<head>${CSP}`) : CSP + html), [html])
  return (
    <section className="card space-y-2">
      <h2 className="section-title">{t('ctf.sandbox')}</h2>
      <p className="muted text-xs">{t('ctf.sandboxNote')}</p>
      <iframe title={t('ctf.sandbox')} sandbox="allow-scripts allow-forms" srcDoc={doc} className="h-64 w-full rounded-lg border" style={{ borderColor: 'var(--border)', background: 'white' }} />
      <details className="text-sm">
        <summary className="link cursor-pointer">{t('ctf.source')}</summary>
        <pre className="run-output mt-2 overflow-x-auto whitespace-pre-wrap text-xs">{html}</pre>
      </details>
    </section>
  )
}

function Lab({ ch }: { ch: Challenge }) {
  const t = useT()
  const [flag, setFlag] = useState<string | null>(null)
  return (
    <section className="card space-y-2">
      <h2 className="section-title">{t('ctf.lab')}</h2>
      {ch.lab!.description && <p className="text-sm">{ch.lab!.description}</p>}
      <p className="muted text-xs">{t('ctf.labNote')}</p>
      <div className="text-sm font-semibold">{t('ctf.labStart')}</div>
      <pre className="run-output overflow-x-auto text-xs">{flag ? ch.lab!.start.replace('{FLAG}', flag) : ch.lab!.start}</pre>
      <div className="text-sm font-semibold">{t('ctf.labReset')}</div>
      <pre className="run-output overflow-x-auto text-xs">{ch.lab!.reset}</pre>
      {ch.lab!.start.includes('{FLAG}') && !flag && (
        <button className="btn" onClick={async () => { const r = await myLabFlag(ch.course, ch.id); if (!('error' in r)) setFlag(r.flag) }}>
          {t('ctf.labFlag')}
        </button>
      )}
    </section>
  )
}

function External({ ch }: { ch: Challenge }) {
  const t = useT()
  const x = ch.external!
  return (
    <section className="card space-y-2">
      <h2 className="section-title">{x.platform}</h2>
      <p className="muted text-xs">{t('ctf.externalNote')}</p>
      <a className="btn btn-primary" href={x.url} target="_blank" rel="noopener noreferrer">
        {t('ctf.openPlatform', { platform: x.platform })} ↗
      </a>
      {x.levels && (
        <ul className="space-y-1">
          {x.levels.map((l) => (
            <LevelCheck key={l} id={`external:${ch.id}:${l}`} label={l} />
          ))}
        </ul>
      )}
      <ExternalNotes id={ch.id} />
    </section>
  )
}

function LevelCheck({ id, label }: { id: string; label: string }) {
  const [on, set] = useCheck(id)
  return (
    <li>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} /> {label}
      </label>
    </li>
  )
}

function ExternalNotes({ id }: { id: string }) {
  const t = useT()
  const store = useStore()
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    store.get('notes', `challenge:${id}`).then((r) => setText(r?.text || ''))
  }, [store, id])
  useEffect(() => {
    if (text === null) return
    const timer = setTimeout(() => store.put('notes', { id: `challenge:${id}`, text }), 500)
    return () => clearTimeout(timer)
  }, [text, id, store])
  return <textarea className="input min-h-[5rem]" value={text ?? ''} onChange={(e) => setText(e.target.value)} placeholder={t('ctf.notes')} aria-label={t('ctf.notes')} />
}

function download(name: string, text: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
