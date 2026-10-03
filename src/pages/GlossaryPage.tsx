import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { fold } from '@/lib/search'
import { CourseDot, ErrorBox, Loading } from '@/components/ui'
import { useT } from '@/i18n'

export default function GlossaryPage() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const course = params.get('kursus') || 'alle'
  const { data, error } = useAsync(async () => {
    const idx = await loadIndex()
    return Promise.all(idx.courses.map((c) => loadCourse(c.slug)))
  }, [])
  const entries = useMemo(() => {
    if (!data) return []
    const all = data.flatMap((c) => c.glossary.map((g) => ({ ...g, color: c.meta.color, title: c.meta.title })))
    const fq = fold(q)
    return all
      .filter((g) => course === 'alle' || g.course === course)
      .filter((g) => !fq || fold(`${g.da} ${g.en}`).includes(fq))
      .sort((a, b) => a.da.localeCompare(b.da, 'da'))
  }, [data, q, course])
  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading what="ordliste" />
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="page-title">{t('glossary.title')}</h1>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className="input" placeholder={t('glossary.filter')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('glossary.filterLabel')} />
        <select className="input sm:w-56" value={course} onChange={(e) => setParams(e.target.value === 'alle' ? {} : { kursus: e.target.value })} aria-label={t('train.course')}>
          <option value="alle">{t('train.allCourses')}</option>
          {data.map((c) => (
            <option key={c.meta.slug} value={c.meta.slug}>
              {c.meta.title}
            </option>
          ))}
        </select>
      </div>
      <p className="muted text-sm">{t('glossary.count', { n: entries.length })}</p>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th className="p-2 text-left">{t('lang.da')}</th>
              <th className="p-2 text-left">{t('lang.en')}</th>
              <th className="p-2 text-left">{t('glossary.where')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((g, i) => (
              <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="p-2 font-medium">{g.da}</td>
                <td className="p-2">{g.en}</td>
                <td className="p-2">
                  <span className="flex items-center gap-1.5">
                    <CourseDot color={g.color} />
                    {g.week && /^\d+$/.test(g.week) ? (
                      <Link className="link" to={`/kursus/${g.course}/uge/${g.week}`}>
                        {t('missing.week', { n: g.week })}
                      </Link>
                    ) : (
                      <span className="muted">{g.week || ''}</span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
