import { Link, useParams } from 'react-router-dom'
import { loadCourse } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { Html } from '@/components/Html'
import { Crumbs, ErrorBox, Loading } from '@/components/ui'
import { useT } from '@/i18n'

export default function InfoPage() {
  const t = useT()
  const { slug = '', page = '' } = useParams()
  const { data: course, error } = useAsync(() => loadCourse(slug), [slug])
  if (error) return <ErrorBox error={error} />
  if (!course) return <Loading />
  const p = course.info.find((x) => x.slug === page)
  if (!p) return <p>{t('notFound.title')}.</p>
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Crumbs items={[{ to: `/kursus/${slug}`, label: course.meta.title }, { label: p.title }]} />
      <h1 className="page-title">{p.title}</h1>
      <Html html={p.html} className="card" />
      <nav className="flex flex-wrap gap-2 text-sm">
        {course.info.filter((x) => x.slug !== page).map((x) => (
          <Link key={x.slug} className="btn" to={`/kursus/${slug}/info/${x.slug}`}>
            {x.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}
