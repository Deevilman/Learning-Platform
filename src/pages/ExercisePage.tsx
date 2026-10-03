import { Link, useParams } from 'react-router-dom'
import { loadCourse, loadWeek } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { ExerciseCard, fromBank } from '@/components/ExerciseCard'
import { Crumbs, ErrorBox, Loading, useTrackPosition } from '@/components/ui'
import { useT } from '@/i18n'

export default function ExercisePage() {
  const t = useT()
  const { slug = '', week = '1', num = '' } = useParams()
  const n = Number(week)
  const { data, error } = useAsync(async () => ({ course: await loadCourse(slug), week: await loadWeek(slug, n) }), [slug, n])
  const ex = data?.week.exercises.find((e) => e.number === num)
  useTrackPosition(data && ex ? { path: `/kursus/${slug}/uge/${n}/opgave/${num}`, label: `${data.course.meta.title} · ${t('exercise.title', { n: num })}`, course: slug, week: n } : null)
  if (error) return <ErrorBox error={error} />
  if (!data) return <Loading what="øvelse" />
  if (!ex) return <p>{t('exercise.notFound', { n: num, week: n })}</p>
  const i = data.week.exercises.indexOf(ex)
  const prev = data.week.exercises[i - 1]
  const next = data.week.exercises[i + 1]
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Crumbs
        items={[
          { to: `/kursus/${slug}`, label: data.course.meta.title },
          { to: `/kursus/${slug}/uge/${n}`, label: t('crumb.week', { n }) },
          { label: t('exercise.title', { n: num }) },
        ]}
      />
      <ExerciseCard ex={fromBank(ex)} />
      <nav className="flex justify-between">
        {prev ? (
          <Link className="btn" to={`/kursus/${slug}/uge/${n}/opgave/${prev.number}`}>
            ← {prev.number}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn btn-primary" to={`/kursus/${slug}/uge/${n}/opgave/${next.number}`}>
            {t('exercise.next', { n: next.number })}
          </Link>
        ) : (
          <Link className="btn btn-primary" to={`/kursus/${slug}/uge/${n}`}>
            {t('exercise.backToWeek')}
          </Link>
        )}
      </nav>
    </div>
  )
}
