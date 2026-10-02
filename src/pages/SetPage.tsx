import { useParams } from 'react-router-dom'
import { loadCourse, loadSet } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { Html } from '@/components/Html'
import { ExerciseCard, fromBank } from '@/components/ExerciseCard'
import { Crumbs, ErrorBox, Loading, useTrackPosition } from '@/components/ui'

export default function SetPage() {
  const { slug = '', set = '' } = useParams()
  const { data, error } = useAsync(async () => ({ course: await loadCourse(slug), set: await loadSet(slug, set) }), [slug, set])
  const title = data?.set.title.replace(/^[^\p{L}]+/u, '') || ''
  useTrackPosition(data ? { path: `/kursus/${slug}/saet/${set}`, label: `${data.course.meta.title} · ${title}`, course: slug } : null)
  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading />
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Crumbs items={[{ to: `/kursus/${slug}`, label: data.course.meta.title }, { label: title }]} />
      <h1 className="text-2xl font-bold">{data.set.title}</h1>
      {data.set.introHtml && <Html html={data.set.introHtml} className="card" />}
      {data.set.exercises.map((e) => (
        <div key={e.id} id={`q-${e.number}`}>
          <ExerciseCard ex={fromBank(e)} heading={`Spørgsmål ${e.number}`} />
        </div>
      ))}
    </div>
  )
}
