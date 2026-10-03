import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { generators } from '@/lib/generators'
import { Html } from '@/components/Html'
import { CourseDot, ErrorBox, Loading } from '@/components/ui'
import { miniMarkdown } from '@/lib/mini-md'
import { useT } from '@/i18n'

/** "Prøv selv": every interactive tool, grouped by course, with where it appears in the notes. */
export default function InteractivesPage() {
  const t = useT()
  const { data, error } = useAsync(async () => {
    const idx = await loadIndex()
    const courses = await Promise.all(idx.courses.map((c) => loadCourse(c.slug)))
    return { idx, courses }
  }, [])
  const [open, setOpen] = useState<string | null>(null)
  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading what="værktøjer" />

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">{t('nav.tryIt')}</h1>
        <p className="muted">{t('try.intro')}</p>
      </div>
      {data.courses.map((c) => (
        <section key={c.meta.slug} className="space-y-3">
          <h2 className="section-title flex items-center gap-2">
            <CourseDot color={c.meta.color} /> {c.meta.title}
          </h2>
          <ul className="space-y-3">
            {c.tryIt.map((it) => (
              <li key={it.id} className="card space-y-3">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{it.title}</div>
                    {it.intro && <div className="muted text-sm" dangerouslySetInnerHTML={{ __html: it.intro }} />}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button className="btn" aria-expanded={open === it.id} onClick={() => setOpen(open === it.id ? null : it.id)}>
                      {open === it.id ? t('try.close') : t('try.here')}
                    </button>
                    <Link className="btn" to={`/kursus/${c.meta.slug}/uge/${it.week}?fane=laes&prov=${it.id}`}>
                      {t('crumb.week', { n: it.week })}
                    </Link>
                  </div>
                </div>
                {open === it.id && <Html key={it.id} html={`<div class="interactive" data-interactive="${it.id}" data-props="{}"></div>`} />}
              </li>
            ))}
          </ul>
          <TopicPractice course={c.meta.slug} topics={c.meta.topics} />
        </section>
      ))}
    </div>
  )
}

/** Topics with regneopgaver that are made with new numbers every time. */
function TopicPractice({ course, topics }: { course: string; topics: { id: string; name: string }[] }) {
  const t = useT()
  const withGens = topics.filter((tp) => generators.some((g) => g.course === course && g.topics.includes(tp.id)))
  const [peek, setPeek] = useState<string | null>(null)
  if (!withGens.length) return null
  const g = peek ? generators.find((x) => x.course === course && x.topics.includes(peek)) : undefined
  const ex = g?.generate(Math.floor(Math.random() * 1e9), g.difficulties[0])
  return (
    <div className="card-flat space-y-2" style={{ background: 'var(--surface-2)' }}>
      <div className="text-sm font-semibold">{t('try.newNumbers')}</div>
      <div className="flex flex-wrap gap-2">
        {withGens.map((tp) => (
          <Link key={tp.id} className="btn" to={`/traen?kursus=${course}&emne=${tp.id}&start=1`}>
            {tp.name}
          </Link>
        ))}
      </div>
      {ex && <Html html={miniMarkdown(ex.prompt)} />}
      {!peek && (
        <button className="link text-xs" onClick={() => setPeek(withGens[0].id)}>
          {t('try.example')}
        </button>
      )}
    </div>
  )
}
