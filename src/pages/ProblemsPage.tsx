// "Kodeopgaver": every coding problem, with filters on course, topic,
// difficulty and status, and a "Næste opgave" suggestion.

import { Link, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useTable } from '@/lib/store'
import { nextProblem, problemStatus, type ProblemStatus } from '@/lib/code-problems'
import { STARS } from '@/components/ExerciseCard'
import { useT, type Key } from '@/i18n'
import { ErrorBox, Loading } from '@/components/ui'
import type { CodeProblem } from '@/types/content'

export const STATUS_KEY: Record<ProblemStatus, Key> = { solved: 'code.solved', tried: 'code.tried', new: 'code.new' }
export const problemHref = (p: Pick<CodeProblem, 'id'>) => `/kode/opgave?id=${encodeURIComponent(p.id)}`

export default function ProblemsPage() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const subs = useTable('submissions')
  const attempts = useTable('attempts')
  const { data, error } = useAsync(async () => {
    const idx = await loadIndex()
    const courses = await Promise.all(idx.courses.map((c) => loadCourse(c.slug)))
    return courses.filter((c) => c.problems?.length).map((c) => ({ slug: c.meta.slug, title: c.meta.title, topics: c.meta.topics, problems: c.problems! }))
  }, [])
  const f = { course: params.get('kursus') || '', topic: params.get('emne') || '', level: params.get('svaerhed') || '', status: params.get('status') || '' }
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    setParams(p, { replace: true })
  }
  const all = useMemo(() => (data || []).flatMap((c) => c.problems), [data])
  if (error) return <ErrorBox error={error} />
  if (!data || !subs || !attempts) return <Loading />
  const topics = data.filter((c) => !f.course || c.slug === f.course).flatMap((c) => c.topics.filter((tp) => c.problems.some((p) => p.topics.includes(tp.id))).map((tp) => ({ ...tp, course: c.slug })))
  const shown = all.filter((p) => (!f.course || p.course === f.course) && (!f.topic || p.topics.includes(f.topic)) && (!f.level || String(p.difficulty) === f.level) && (!f.status || problemStatus(p.id, subs) === f.status))
  const next = nextProblem(shown.length ? shown : all, subs, attempts, Date.now())
  const solved = all.filter((p) => problemStatus(p.id, subs) === 'solved').length

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="page-title">{t('nav.code')}</h1>
        <p className="muted">{t('code.intro')}</p>
      </div>
      {!all.length ? (
        <p className="card muted">{t('code.none')}</p>
      ) : (
        <>
          {next && (
            <section className="card-flat flex flex-wrap items-center gap-3" style={{ background: 'var(--accent-soft)' }}>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                  {t('code.nextTitle')}
                </div>
                <div className="font-medium">{next.title}</div>
              </div>
              <Link className="btn btn-primary shrink-0" to={problemHref(next)}>
                {t('code.open')}
              </Link>
            </section>
          )}
          <section className="card grid gap-3 sm:grid-cols-4" aria-label={t('code.filters')}>
            <Select label={t('train.course')} value={f.course} onChange={(v) => (set('kursus', v), set('emne', ''))} options={data.map((c) => [c.slug, c.title])} all={t('train.allCourses')} />
            <Select label={t('course.topics')} value={f.topic} onChange={(v) => set('emne', v)} options={topics.map((tp) => [tp.id, tp.name])} all={t('practice.all')} />
            <Select label={t('code.difficulty')} value={f.level} onChange={(v) => set('svaerhed', v)} options={(['1', '2', '3'] as const).map((d) => [d, STARS[Number(d) as 1 | 2 | 3]])} all={t('practice.all')} />
            <Select label={t('code.status')} value={f.status} onChange={(v) => set('status', v)} options={(['new', 'tried', 'solved'] as ProblemStatus[]).map((s) => [s, t(STATUS_KEY[s])])} all={t('practice.all')} />
          </section>
          <p className="muted text-sm">{t('code.count', { n: shown.length, solved, total: all.length })}</p>
          <ul className="space-y-2">
            {shown.map((p) => {
              const st = problemStatus(p.id, subs)
              return (
                <li key={p.id}>
                  <Link to={problemHref(p)} className="card flex flex-wrap items-center gap-3 hover:shadow-md">
                    <span className="chip" style={st === 'solved' ? { background: 'var(--ok-soft)', color: 'var(--ok)' } : st === 'tried' ? { background: 'var(--warn-soft)' } : undefined}>
                      {t(STATUS_KEY[st])}
                    </span>
                    <span className="min-w-0 flex-1 font-medium">{p.title}</span>
                    <span className="muted text-xs">{p.languages.join(' · ')}</span>
                    <span style={{ color: 'var(--warn)' }}>{STARS[p.difficulty]}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

function Select({ label, value, onChange, options, all }: { label: string; value: string; onChange: (v: string) => void; options: (readonly [string, string])[]; all: string }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select className="input mt-1" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{all}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}
