import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { uid, useStore, useTable } from '@/lib/store'
import type { LogEntry } from '@/lib/storage/types'

const TEMPLATE = `De tre vigtigste idéer, med mine egne ord:
  1.
  2.
  3.
Det har jeg endnu ikke forstået:
Én forbindelse til en tidligere uge:
Checkpoint bestået? ja / nej, gentager: `

const today = () => new Date().toISOString().slice(0, 10)

function isoWeek(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day + 3)
  const firstThursday = new Date(d.getFullYear(), 0, 4)
  return `${d.getFullYear()}-U${String(1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)).padStart(2, '0')}`
}

export default function LogbookPage() {
  const [params] = useSearchParams()
  const store = useStore()
  const entries = useTable('logbook')
  const { data: index } = useAsync(loadIndex, [])
  const blank = (): Omit<LogEntry, 'updatedAt'> => ({ id: '', date: today(), course: params.get('kursus') || '', week: params.get('uge') ? Number(params.get('uge')) : undefined, minutes: 60, text: '' })
  const [draft, setDraft] = useState(blank)
  const groups = useMemo(() => {
    const m = new Map<string, LogEntry[]>()
    for (const e of [...(entries || [])].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt)) {
      const k = isoWeek(e.date)
      m.set(k, [...(m.get(k) || []), e])
    }
    return [...m.entries()]
  }, [entries])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    await store.put('logbook', { ...draft, id: draft.id || uid(), minutes: Number(draft.minutes) || 0, course: draft.course || undefined })
    setDraft(blank())
  }

  const courseTitle = (s?: string) => index?.courses.find((c) => c.slug === s)?.title || s || ''

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="page-title">Logbog</h1>
        <p className="muted">Fem minutter efter hver arbejdsgang. Tiden tæller med i din statistik.</p>
      </div>
      <form className="card space-y-3" onSubmit={save}>
        <h2 className="font-semibold">{draft.id ? 'Ret indlæg' : 'Nyt indlæg'}</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm">
            Dato
            <input type="date" className="input mt-1" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} required />
          </label>
          <label className="text-sm">
            Kursus
            <select className="input mt-1" value={draft.course || ''} onChange={(e) => setDraft({ ...draft, course: e.target.value })}>
              <option value="">—</option>
              {index?.courses.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Uge
            <input type="number" min={1} max={30} className="input mt-1" value={draft.week ?? ''} onChange={(e) => setDraft({ ...draft, week: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <label className="text-sm">
            Minutter
            <input type="number" min={0} step={5} className="input mt-1" value={draft.minutes} onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) })} />
          </label>
        </div>
        <label className="block text-sm">
          Noter
          <textarea className="input mt-1 min-h-[8rem]" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" type="submit">
            Gem
          </button>
          {!draft.text && (
            <button type="button" className="btn" onClick={() => setDraft({ ...draft, text: TEMPLATE })}>
              Indsæt skabelon
            </button>
          )}
          {draft.id && (
            <button type="button" className="btn" onClick={() => setDraft(blank())}>
              Annullér
            </button>
          )}
        </div>
      </form>
      {groups.map(([week, list]) => (
        <section key={week} className="space-y-2">
          <h2 className="flex justify-between text-sm font-semibold">
            <span>{week.replace('-U', ', uge ')}</span>
            <span className="muted">{(list.reduce((s, e) => s + e.minutes, 0) / 60).toLocaleString('da-DK', { maximumFractionDigits: 1 })} t</span>
          </h2>
          {list.map((e) => (
            <article key={e.id} className="card space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <b>{new Date(e.date + 'T12:00:00').toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })}</b>
                {e.course && <span className="chip">{courseTitle(e.course)}{e.week ? ` · uge ${e.week}` : ''}</span>}
                <span className="muted">{e.minutes} min</span>
                <span className="ml-auto flex gap-2">
                  <button className="link text-xs" onClick={() => (setDraft(e), window.scrollTo({ top: 0, behavior: 'smooth' }))}>
                    Ret
                  </button>
                  <button className="link text-xs" onClick={() => confirm('Slet indlægget?') && store.delete('logbook', e.id)}>
                    Slet
                  </button>
                </span>
              </div>
              {e.text && <p className="whitespace-pre-wrap text-sm">{e.text}</p>}
            </article>
          ))}
        </section>
      ))}
      {entries && !entries.length && <p className="muted">Ingen indlæg endnu.</p>}
    </div>
  )
}
