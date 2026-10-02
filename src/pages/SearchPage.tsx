import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadIndex, loadSearch } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { search, type SearchHit } from '@/lib/search'
import { ErrorBox, Loading, CourseDot } from '@/components/ui'

const TYPE_LABEL = { exercise: 'Øvelse', note: 'Noter', glossary: 'Ordliste', info: 'Info', video: 'Video' } as const

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [type, setType] = useState<string>('alle')
  const { data, error } = useAsync(async () => ({ docs: await loadSearch(), index: await loadIndex() }), [])
  useEffect(() => {
    const t = setTimeout(() => setParams(q ? { q } : {}, { replace: true }), 300)
    return () => clearTimeout(t)
  }, [q, setParams])
  const hits: SearchHit[] = useMemo(() => (data && q.trim().length >= 2 ? search(data.docs, q, type === 'alle' ? undefined : type) : []), [data, q, type])
  if (error) return <ErrorBox error={error} />
  const color = (slug: string) => data?.index.courses.find((c) => c.slug === slug)?.color || 'var(--muted)'
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Søg</h1>
      <input className="input text-base" autoFocus placeholder="Søg i øvelser, noter, videoer og ordliste… (fx 'Cantor', 'Sharpe', 'high-water mark')" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Søgetekst" />
      <div className="flex flex-wrap gap-1.5 text-sm">
        {['alle', 'exercise', 'note', 'video', 'glossary', 'info'].map((t) => (
          <button key={t} className="btn" aria-pressed={type === t} style={type === t ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined} onClick={() => setType(t)}>
            {t === 'alle' ? 'Alle' : TYPE_LABEL[t as keyof typeof TYPE_LABEL]}
          </button>
        ))}
      </div>
      {!data ? (
        <Loading what="søgeindeks" />
      ) : q.trim().length < 2 ? (
        <p className="muted">Skriv mindst to tegn.</p>
      ) : (
        <>
          <p className="muted text-sm">{hits.length === 100 ? '100+' : hits.length} resultater</p>
          <ul className="space-y-2">
            {hits.map((h) => (
              <li key={h.doc.id}>
                <Link to={h.doc.href} className="card block hover:shadow-md">
                  <div className="flex items-center gap-2 text-xs">
                    <CourseDot color={color(h.doc.course)} />
                    <span className="chip">{TYPE_LABEL[h.doc.type]}</span>
                    <span className="muted">
                      {h.doc.course}
                      {h.doc.week ? ` · uge ${h.doc.week}` : ''}
                    </span>
                  </div>
                  <div className="mt-1 font-medium">{h.doc.title}</div>
                  <p className="muted mt-0.5 text-sm" dangerouslySetInnerHTML={{ __html: h.snippet }} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
