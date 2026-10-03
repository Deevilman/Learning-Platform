// On a course page: "Vi anbefaler at tage X først" when its prerequisites
// aren't done (with "Gå til X" / "Start alligevel" — nothing is locked), and
// "Næste kursus" once the course is finished.

import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useSetting, useTable } from '@/lib/store'
import { buildCourseMap, recommendNext } from '@/lib/course-map'
import { useT } from '@/i18n'

export const prereqDismissKey = (slug: string) => `prereq-ok:${slug}`

export function useCourseMap() {
  const { data } = useAsync(async () => {
    const idx = await loadIndex()
    const courses = await Promise.all(idx.courses.map((c) => loadCourse(c.slug)))
    return { idx, courses: new Map(courses.map((c) => [c.meta.slug, c])) }
  }, [])
  const checks = useTable('checks')
  const attempts = useTable('attempts')
  return useMemo(() => {
    if (!data || !checks || !attempts) return null
    const checkMap = new Map(checks.map((c) => [c.id, c.value]))
    return buildCourseMap(data.idx.courses, data.idx.planned || [], data.courses, checkMap, attempts, Date.now())
  }, [data, checks, attempts])
}

export function PrerequisiteNote({ slug }: { slug: string }) {
  const t = useT()
  const nodes = useCourseMap()
  const [ok, setOk, loaded] = useSetting<boolean>(prereqDismissKey(slug), false)
  const self = nodes?.find((n) => n.slug === slug)
  if (!loaded || ok || !self || self.status !== 'later' || !self.missing.length) return null
  const first = nodes!.find((n) => n.slug === self.missing[0])!
  const names = self.missing.map((s) => nodes!.find((n) => n.slug === s)?.title || s).join(` ${t('prereq.and')} `)
  return (
    <section className="card-flat space-y-2" style={{ background: 'var(--warn-soft)' }} role="note">
      <div className="font-semibold">{t('prereq.title', { list: names })}</div>
      <p className="text-sm">{t('prereq.text')}</p>
      <div className="flex flex-wrap gap-2">
        {!first.planned && (
          <Link className="btn btn-primary" to={`/kursus/${first.slug}`}>
            {t('prereq.goTo', { title: first.title })}
          </Link>
        )}
        <button className="btn" onClick={() => setOk(true)}>
          {t('prereq.startAnyway')}
        </button>
      </div>
    </section>
  )
}

export function NextCourses({ slug }: { slug: string }) {
  const t = useT()
  const nodes = useCourseMap()
  const self = nodes?.find((n) => n.slug === slug)
  if (!self || self.status !== 'done') return null
  const next = recommendNext(nodes!, slug)
  if (!next.length) return null
  return (
    <section className="card space-y-3" aria-labelledby="next-course-h" style={{ background: 'var(--ok-soft)' }}>
      <h2 id="next-course-h" className="section-title">
        {t('nextCourse.title')}
      </h2>
      <p className="text-sm">{t('nextCourse.text', { title: self.title })}</p>
      <ul className="flex flex-wrap gap-2">
        {next.map((n) =>
          n.planned ? (
            <li key={n.slug} className="chip">
              {n.title} · {t('map.planned')}
            </li>
          ) : (
            <li key={n.slug}>
              <Link className="btn btn-primary" to={`/kursus/${n.slug}`}>
                {n.title} →
              </Link>
            </li>
          ),
        )}
      </ul>
    </section>
  )
}
