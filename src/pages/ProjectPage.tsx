import { useParams } from 'react-router-dom'
import { loadCourse } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useCheck } from '@/lib/store'
import { projectCheckId } from '@/lib/progress'
import { Html } from '@/components/Html'
import { Crumbs, ErrorBox, Loading, useTrackPosition } from '@/components/ui'

function CheckItem({ id, html }: { id: string; html: string }) {
  const [on, set] = useCheck(id)
  return (
    <li>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" style={{ accentColor: 'var(--accent)' }} checked={on} onChange={(e) => set(e.target.checked)} />
        <span className="prose-content" dangerouslySetInnerHTML={{ __html: html }} />
      </label>
    </li>
  )
}

export default function ProjectPage() {
  const { slug = '' } = useParams()
  const { data: course, error } = useAsync(() => loadCourse(slug), [slug])
  useTrackPosition(course?.project ? { path: `/kursus/${slug}/projekt`, label: `${course.meta.title} · Projekt`, course: slug } : null)
  if (error) return <ErrorBox error={error} />
  if (!course) return <Loading />
  const p = course.project
  if (!p) return <p>Kurset har intet afsluttende projekt.</p>
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Crumbs items={[{ to: `/kursus/${slug}`, label: course.meta.title }, { label: 'Afsluttende projekt' }]} />
      <h1 className="text-2xl font-bold">{p.title}</h1>
      <Html html={p.introHtml} className="card" />
      <nav className="flex flex-wrap gap-2" aria-label="Projektdele">
        {p.parts.map((part) => (
          <a key={part.id} className="btn" href={`#del-${part.id}`} onClick={(e) => (e.preventDefault(), document.getElementById(`del-${part.id}`)?.scrollIntoView({ behavior: 'smooth' }))}>
            Del {part.id}
          </a>
        ))}
      </nav>
      {p.parts.map((part) => (
        <section key={part.id} id={`del-${part.id}`} className="card space-y-3">
          <h2 className="text-xl font-bold">
            Del {part.id} — {part.title}
          </h2>
          <Html html={part.html} />
          {part.checklist.length > 0 && (
            <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
              <h3 className="mb-2 font-semibold">Tjekliste</h3>
              <ul className="space-y-2">
                {part.checklist.map((c, i) => (
                  <CheckItem key={i} id={projectCheckId(slug, part.id, i)} html={c} />
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}
      {p.outroHtml && <Html html={p.outroHtml} className="card" />}
    </div>
  )
}
