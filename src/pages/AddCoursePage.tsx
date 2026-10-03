// "Tilføj kursus": drop one course file, see what is in it (or what is wrong,
// with line numbers), and add it. Also lists the learner's own courses.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadIndex } from '@/lib/data'
import { listPacks, onCoursesChanged, removeCourse, saveCourse, setHidden, type StoredPack } from '@/lib/courses/store'
import { pushCourse, removeCloudCourse, setCloudHidden } from '@/lib/courses/cloud'
import type { PreparedCourse } from '@/lib/courses/builder'
import exampleCourse from '../../tests/fixtures/testkursus.md?raw'
import { dateLocale, useLang, useT } from '@/i18n'

export default function AddCoursePage() {
  const t = useT()
  const [lang] = useLang()
  const [packs, setPacks] = useState<StoredPack[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [prepared, setPrepared] = useState<PreparedCourse | null>(null)
  const [siteSlugs, setSiteSlugs] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<{ slug: string; title: string; cloud: string } | null>(null)
  const [drag, setDrag] = useState(false)
  const [checking, setChecking] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const refresh = () => listPacks().then(setPacks)
    refresh()
    fetch(import.meta.env.BASE_URL + 'data/index.json')
      .then((r) => r.json())
      .then((i) => setSiteSlugs(new Set(i.courses.map((c: { slug: string }) => c.slug))))
      .catch(() => {})
    return onCoursesChanged(refresh) as () => void
  }, [])

  async function read(file: File) {
    setSaved(null)
    setPrepared(null)
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      setPrepared({ fileName: file.name, text: '', errors: [{ file: file.name, line: 0, message: t('add.mdOnly') }], warnings: [], blocks: [] })
      return
    }
    setBusy(true)
    const text = await file.text()
    // let the spinner paint before the (synchronous) build
    await new Promise((r) => setTimeout(r, 30))
    try {
      const [{ prepareCourse }, index] = await Promise.all([import('@/lib/courses/builder'), loadIndex()])
      const prep = prepareCourse(text, file.name, index)
      setPrepared(prep)
      // coding problems: the reference solution must pass every test — Python is checked right here
      const refs = prep.build && !prep.errors.length ? prep.build.serverProblems : []
      if (refs.length) {
        setChecking(true)
        const { runPythonLocally } = await import('@/lib/judge')
        const errors = [...prep.errors]
        const warnings = [...prep.warnings]
        for (const sp of refs) {
          if (sp.reference.language !== 'python') {
            warnings.push(t('add.refLater', { id: sp.id }))
            continue
          }
          const r = await runPythonLocally(sp.reference.code, [...sp.publicTests, ...sp.hiddenTests], sp.timeLimit)
          if (r.verdict !== 'AC') errors.push({ file: file.name, line: 0, message: t('add.refFails', { id: sp.id, verdict: r.verdict, n: r.passed, total: r.total }) })
        }
        setPrepared({ ...prep, errors, warnings })
      }
    } catch (e) {
      setPrepared({ fileName: file.name, text, errors: [{ file: file.name, line: 0, message: t('add.unreadable', { error: (e as Error).message }) }], warnings: [], blocks: [] })
    } finally {
      setBusy(false)
      setChecking(false)
    }
  }

  async function add() {
    if (!prepared?.build || prepared.errors.length || !prepared.slug) return
    const b = prepared.build
    setBusy(true)
    try {
      const pack = { slug: prepared.slug, fileName: prepared.fileName, text: prepared.text, title: b.meta.title }
      await saveCourse(pack, { meta: b.meta, course: b.course, weeks: b.weeks, sets: b.sets, summaries: b.summaries, search: b.search })
      const cloud = await pushCourse(pack).catch((e: Error) => t('add.notInCloud', { error: e.message }))
      setSaved({ slug: prepared.slug, title: b.meta.title, cloud })
      setPrepared(null)
    } finally {
      setBusy(false)
    }
  }

  const existing = prepared?.slug ? packs?.find((p) => p.slug === prepared.slug) : undefined

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">{t('nav.addCourse')}</h1>
        <p className="muted">{t('add.intro')}</p>
      </div>

      <section
        className={`dropzone ${drag ? 'dropzone-on' : ''}`}
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          const f = e.dataTransfer.files[0]
          if (f) read(f)
        }}
      >
        <p className="font-medium">{t('add.drop')}</p>
        <p className="muted text-sm">{t('add.or')}</p>
        <button className="btn btn-primary" onClick={() => input.current?.click()} disabled={busy}>
          {t('add.choose')}
        </button>
        <input
          ref={input}
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          className="hidden"
          aria-label={t('add.file')}
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) read(f)
          }}
        />
        <p className="muted text-xs">
          {t('add.newToFormat')}{' '}
          <button className="link" onClick={() => download('eksempel-kursus.md', exampleCourse)}>
            {t('add.example')}
          </button>{' '}
          {t('add.exampleContents')}
        </p>
      </section>

      {busy && <p className="muted fade-in">{t('add.reading')}</p>}

      {saved && (
        <section className="card fade-in space-y-2" style={{ background: 'var(--ok-soft)' }} role="status">
          <h2 className="section-title">{t('add.added', { title: saved.title })}</h2>
          <p className="text-sm">{saved.cloud}</p>
          <Link className="btn btn-primary" to={`/kursus/${saved.slug}`}>
            {t('add.goTo')}
          </Link>
        </section>
      )}

      {checking && <p className="muted fade-in">{t('add.checkingCode')}</p>}
      {prepared && <Preview prepared={prepared} existing={existing} replacesSite={!!prepared.slug && siteSlugs.has(prepared.slug)} onAdd={add} busy={busy || checking} />}

      <section className="space-y-3">
        <h2 className="section-title">{t('add.yours')}</h2>
        {!packs?.length ? (
          <p className="muted text-sm">{t('add.none')}</p>
        ) : (
          <ul className="space-y-2">
            {packs.map((p) => (
              <li key={p.slug} className="card flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{p.title}</div>
                  <div className="muted text-xs">
                    {p.fileName} · {t('add.updated', { date: new Date(p.updatedAt).toLocaleDateString(dateLocale(lang)) })}
                    {p.hidden ? ` · ${t('add.hiddenTag')}` : ''}
                  </div>
                </div>
                {!p.hidden && (
                  <Link className="btn" to={`/kursus/${p.slug}`}>
                    {t('add.open')}
                  </Link>
                )}
                <button className="btn" onClick={async () => (await setHidden(p.slug, !p.hidden), setCloudHidden(p.slug, !p.hidden).catch(() => {}))}>
                  {p.hidden ? t('add.show') : t('add.hide')}
                </button>
                <button
                  className="btn"
                  onClick={async () => {
                    if (!confirm(t('add.confirmDelete', { title: p.title }))) return
                    await removeCourse(p.slug)
                    await removeCloudCourse(p.slug).catch(() => {})
                  }}
                >
                  {t('add.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="muted text-xs">{t('add.updateNote')}</p>
      </section>
    </div>
  )
}

function Preview({ prepared, existing, replacesSite, onAdd, busy }: { prepared: PreparedCourse; existing?: StoredPack; replacesSite: boolean; onAdd: () => void; busy: boolean }) {
  const t = useT()
  const ok = !prepared.errors.length && !!prepared.build
  const c = prepared.counts
  const errors = [...prepared.errors].sort((a, b) => a.line - b.line)
  return (
    <section className="card fade-in space-y-4" aria-label={t('add.preview')}>
      <div>
        <div className="muted text-xs">{prepared.fileName}</div>
        <h2 className="section-title">{prepared.title || t('add.couldNotRead')}</h2>
      </div>
      {c && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              [c.weeks, t('courses.weeks')],
              [c.exercises, t('courses.exercises')],
              [c.videos, t('courses.videos')],
              [c.lessons, t('add.lessons')],
              [c.templates, t('add.templates')],
              [c.problems, t('add.problems')],
              [c.challenges, t('add.challenges')],
              [c.glossary, t('add.glossary')],
            ] as const
          ).map(([n, label]) => (
            <div key={label} className="stat">
              <b>{n}</b>
              {label}
            </div>
          ))}
        </dl>
      )}
      {errors.length > 0 && (
        <div className="space-y-2 rounded-xl p-4" style={{ background: 'var(--warn-soft)' }}>
          <div className="font-semibold">
            {errors.length === 1 ? t('add.fixOne') : t('add.fixMany', { n: errors.length })}
          </div>
          <ul className="space-y-1 text-sm">
            {errors.slice(0, 50).map((e, i) => (
              <li key={i}>
                {e.line ? <b>{t('add.line', { n: e.line })} </b> : null}
                {e.message}
              </li>
            ))}
          </ul>
          {errors.length > 50 && <p className="muted text-sm">{t('add.andMore', { n: errors.length - 50 })}</p>}
        </div>
      )}
      {prepared.warnings.length > 0 && (
        <details className="text-sm">
          <summary className="link cursor-pointer">{t('add.warnings', { n: prepared.warnings.length })}</summary>
          <ul className="muted mt-2 space-y-1">
            {prepared.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      )}
      {ok && existing && <p className="text-sm">{t('add.alreadyHave')}</p>}
      {ok && !existing && replacesSite && <p className="text-sm">{t('add.replacesSite')}</p>}
      {ok && (
        <button className="btn btn-primary" onClick={onAdd} disabled={busy}>
          {existing ? t('add.update') : t('add.add')}
        </button>
      )}
    </section>
  )
}

function download(name: string, text: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
