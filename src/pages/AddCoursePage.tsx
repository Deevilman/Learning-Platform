// "Tilføj kursus": drop one course file, see what is in it (or what is wrong,
// with line numbers), and add it. Also lists the learner's own courses.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadIndex } from '@/lib/data'
import { listPacks, onCoursesChanged, removeCourse, saveCourse, setHidden, type StoredPack } from '@/lib/courses/store'
import { pushCourse, removeCloudCourse, setCloudHidden } from '@/lib/courses/cloud'
import type { PreparedCourse } from '@/lib/courses/builder'
import exampleCourse from '../../tests/fixtures/testkursus.md?raw'

export default function AddCoursePage() {
  const [packs, setPacks] = useState<StoredPack[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [prepared, setPrepared] = useState<PreparedCourse | null>(null)
  const [siteSlugs, setSiteSlugs] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<{ slug: string; title: string; cloud: string } | null>(null)
  const [drag, setDrag] = useState(false)
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
      setPrepared({ fileName: file.name, text: '', errors: [{ file: file.name, line: 0, message: 'Kursusfilen skal være en Markdown-fil (.md).' }], warnings: [], blocks: [] })
      return
    }
    setBusy(true)
    const text = await file.text()
    // let the spinner paint before the (synchronous) build
    await new Promise((r) => setTimeout(r, 30))
    try {
      const [{ prepareCourse }, index] = await Promise.all([import('@/lib/courses/builder'), loadIndex()])
      setPrepared(prepareCourse(text, file.name, index))
    } catch (e) {
      setPrepared({ fileName: file.name, text, errors: [{ file: file.name, line: 0, message: `Filen kunne ikke læses: ${(e as Error).message}` }], warnings: [], blocks: [] })
    } finally {
      setBusy(false)
    }
  }

  async function add() {
    if (!prepared?.build || prepared.errors.length || !prepared.slug) return
    const b = prepared.build
    setBusy(true)
    try {
      const pack = { slug: prepared.slug, fileName: prepared.fileName, text: prepared.text, title: b.meta.title }
      await saveCourse(pack, { meta: b.meta, course: b.course, weeks: b.weeks, sets: b.sets, summaries: b.summaries, search: b.search })
      const cloud = await pushCourse(pack).catch((e: Error) => `Kurset er gemt på denne enhed, men ikke i skyen: ${e.message}`)
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
        <h1 className="page-title">Tilføj kursus</h1>
        <p className="muted">Et kursus er én fil. Træk den herind, så viser vi, hvad den indeholder, før du tilføjer den. Kurset kommer med på alle dine enheder, når du er logget ind.</p>
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
        <p className="font-medium">Træk kursusfilen herind</p>
        <p className="muted text-sm">eller</p>
        <button className="btn btn-primary" onClick={() => input.current?.click()} disabled={busy}>
          Vælg fil…
        </button>
        <input
          ref={input}
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          className="hidden"
          aria-label="Kursusfil"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) read(f)
          }}
        />
        <p className="muted text-xs">
          Ny til formatet?{' '}
          <button className="link" onClick={() => download('eksempel-kursus.md', exampleCourse)}>
            Hent en eksempelfil
          </button>{' '}
          med to uger, videoer, øvelser og lektioner.
        </p>
      </section>

      {busy && <p className="muted fade-in">Læser kurset …</p>}

      {saved && (
        <section className="card fade-in space-y-2" style={{ background: 'var(--ok-soft)' }} role="status">
          <h2 className="section-title">"{saved.title}" er tilføjet</h2>
          <p className="text-sm">{saved.cloud}</p>
          <Link className="btn btn-primary" to={`/kursus/${saved.slug}`}>
            Gå til kurset →
          </Link>
        </section>
      )}

      {prepared && <Preview prepared={prepared} existing={existing} replacesSite={!!prepared.slug && siteSlugs.has(prepared.slug)} onAdd={add} busy={busy} />}

      <section className="space-y-3">
        <h2 className="section-title">Dine kurser</h2>
        {!packs?.length ? (
          <p className="muted text-sm">Du har ikke tilføjet nogen kurser endnu.</p>
        ) : (
          <ul className="space-y-2">
            {packs.map((p) => (
              <li key={p.slug} className="card flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{p.title}</div>
                  <div className="muted text-xs">
                    {p.fileName} · opdateret {new Date(p.updatedAt).toLocaleDateString('da-DK')}
                    {p.hidden ? ' · skjult' : ''}
                  </div>
                </div>
                {!p.hidden && (
                  <Link className="btn" to={`/kursus/${p.slug}`}>
                    Åbn
                  </Link>
                )}
                <button className="btn" onClick={async () => (await setHidden(p.slug, !p.hidden), setCloudHidden(p.slug, !p.hidden).catch(() => {}))}>
                  {p.hidden ? 'Vis' : 'Skjul'}
                </button>
                <button
                  className="btn"
                  onClick={async () => {
                    if (!confirm(`Slet "${p.title}"? Dine fremskridt i kurset bliver liggende, hvis du tilføjer det igen senere.`)) return
                    await removeCourse(p.slug)
                    await removeCloudCourse(p.slug).catch(() => {})
                  }}
                >
                  Slet
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="muted text-xs">Vil du opdatere et kursus, så træk den nye udgave af filen herind. Dine fremskridt følger med, fordi de er knyttet til kursets navn (slug), øvelsernes numre og videoernes nøgler.</p>
      </section>
    </div>
  )
}

function Preview({ prepared, existing, replacesSite, onAdd, busy }: { prepared: PreparedCourse; existing?: StoredPack; replacesSite: boolean; onAdd: () => void; busy: boolean }) {
  const ok = !prepared.errors.length && !!prepared.build
  const c = prepared.counts
  const errors = [...prepared.errors].sort((a, b) => a.line - b.line)
  return (
    <section className="card fade-in space-y-4" aria-label="Forhåndsvisning">
      <div>
        <div className="muted text-xs">{prepared.fileName}</div>
        <h2 className="section-title">{prepared.title || 'Kurset kunne ikke læses'}</h2>
      </div>
      {c && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              [c.weeks, 'uger'],
              [c.exercises, 'øvelser'],
              [c.videos, 'videoer'],
              [c.lessons, 'lektioner'],
              [c.templates, 'opgaveskabeloner'],
              [c.problems, 'kodeopgaver'],
              [c.challenges, 'udfordringer'],
              [c.glossary, 'ord i ordlisten'],
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
            {errors.length === 1 ? 'Én ting skal rettes' : `${errors.length} ting skal rettes`}, før kurset kan tilføjes:
          </div>
          <ul className="space-y-1 text-sm">
            {errors.slice(0, 50).map((e, i) => (
              <li key={i}>
                {e.line ? <b>Linje {e.line}: </b> : null}
                {e.message}
              </li>
            ))}
          </ul>
          {errors.length > 50 && <p className="muted text-sm">… og {errors.length - 50} mere.</p>}
        </div>
      )}
      {prepared.warnings.length > 0 && (
        <details className="text-sm">
          <summary className="link cursor-pointer">{prepared.warnings.length} bemærkninger (kurset virker alligevel)</summary>
          <ul className="muted mt-2 space-y-1">
            {prepared.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      )}
      {ok && existing && <p className="text-sm">Du har allerede dette kursus. Det bliver opdateret, og dine fremskridt bevares.</p>}
      {ok && !existing && replacesSite && <p className="text-sm">Sitet har et kursus med samme navn (slug). Din udgave bruges i stedet for, kun hos dig.</p>}
      {ok && (
        <button className="btn btn-primary" onClick={onAdd} disabled={busy}>
          {existing ? 'Opdatér kurset' : 'Tilføj'}
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
