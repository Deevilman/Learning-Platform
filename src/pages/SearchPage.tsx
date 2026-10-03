import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadIndex, loadSearch } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { search, type SearchHit } from '@/lib/search'
import { ErrorBox, Loading, CourseDot } from '@/components/ui'
import { useT } from '@/i18n'

const TYPE_LABEL = { exercise: 'search.exercise', note: 'search.note', glossary: 'nav.glossary', info: 'search.info', video: 'search.video' } as const

export default function SearchPage() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [type, setType] = useState<string>('alle')
  const { data, error } = useAsync(async () => ({ docs: await loadSearch(), index: await loadIndex() }), [])
  useEffect(() => {
    const timer = setTimeout(() => setParams(q ? { q } : {}, { replace: true }), 300)
    return () => clearTimeout(timer)
  }, [q, setParams])
  const hits: SearchHit[] = useMemo(() => (data && q.trim().length >= 2 ? search(data.docs, q, type === 'alle' ? undefined : type) : []), [data, q, type])
  if (error) return <ErrorBox error={error} />
  const color = (slug: string) => data?.index.courses.find((c) => c.slug === slug)?.color || 'var(--muted)'
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">{t('nav.search')}</h1>
      <input className="input text-base" autoFocus placeholder={t('search.placeholder')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('search.label')} />
      <div className="flex flex-wrap gap-1.5 text-sm">
        {['alle', 'exercise', 'note', 'video', 'glossary', 'info'].map((ty) => (
          <button key={ty} className="btn" aria-pressed={type === ty} style={type === ty ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined} onClick={() => setType(ty)}>
            {ty === 'alle' ? t('practice.all') : t(TYPE_LABEL[ty as keyof typeof TYPE_LABEL])}
          </button>
        ))}
      </div>
      {!data ? (
        <Loading what="søgeindeks" />
      ) : q.trim().length < 2 ? (
        <p className="muted">{t('search.min')}</p>
      ) : (
        <>
          <p className="muted text-sm">{t('search.results', { n: hits.length === 100 ? '100+' : hits.length })}</p>
          <ul className="space-y-2">
            {hits.map((h) => (
              <li key={h.doc.id}>
                <Link to={h.doc.href} className="card block hover:shadow-md">
                  <div className="flex items-center gap-2 text-xs">
                    <CourseDot color={color(h.doc.course)} />
                    <span className="chip">{t(TYPE_LABEL[h.doc.type])}</span>
                    <span className="muted">
                      {data?.index.courses.find((c) => c.slug === h.doc.course)?.title || h.doc.course}
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
