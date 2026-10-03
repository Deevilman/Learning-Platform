// Flashcards from the glossaries and formula tables, on the same repetition
// schedule as the exercises. "Vend kort": think, flip, rate yourself.
// "Skriv svaret": type the answer and have it checked.

import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadCourse, loadIndex } from '@/lib/data'
import { useAsync } from '@/lib/useAsync'
import { useSetting, useStore, useTable } from '@/lib/store'
import { newCard, review, RATING_LABEL } from '@/lib/srs'
import { checkTyped, flashcardSession } from '@/lib/flashcards'
import type { Rating } from '@/lib/storage/types'
import type { Flashcard } from '@/types/content'
import { useT } from '@/i18n'
import { ErrorBox, Loading } from '@/components/ui'

type Mode = 'flip' | 'type'

export default function FlashcardsPage() {
  const t = useT()
  const [params, setParams] = useSearchParams()
  const course = params.get('kursus') || 'alle'
  const [mode, setMode] = useSetting<Mode>('flashcards.mode', 'flip')
  const srs = useTable('srs')
  const { data, error } = useAsync(async () => {
    const idx = await loadIndex()
    const courses = await Promise.all(idx.courses.map((c) => loadCourse(c.slug)))
    return courses.filter((c) => c.flashcards?.length).map((c) => ({ slug: c.meta.slug, title: c.meta.title, cards: c.flashcards! }))
  }, [])
  const [session, setSession] = useState<{ cards: Flashcard[]; i: number; right: number } | null>(null)

  if (error) return <ErrorBox error={error} />
  if (!data || !srs) return <Loading />
  const pool = data.filter((c) => course === 'alle' || c.slug === course).flatMap((c) => c.cards)
  const srsMap = new Map(srs.filter((r) => r.id.startsWith('fc:')).map((r) => [r.id, r]))
  const now = Date.now()
  const ready = flashcardSession(pool, srsMap, now, mode)
  const due = ready.filter((c) => srsMap.has(c.id)).length

  if (session)
    return session.i < session.cards.length ? (
      <Review
        key={session.i}
        card={session.cards[session.i]}
        n={session.i + 1}
        total={session.cards.length}
        mode={mode}
        onStop={() => setSession(null)}
        onDone={(ok) => setSession({ ...session, i: session.i + 1, right: session.right + (ok ? 1 : 0) })}
      />
    ) : (
      <div className="card mx-auto max-w-xl space-y-3 text-center">
        <h1 className="text-xl font-bold">{t('train.finished')}</h1>
        <p className="muted">{t('cards.summary', { n: session.cards.length, ok: session.right })}</p>
        <button className="btn btn-primary" onClick={() => setSession(null)}>
          {t('train.back')}
        </button>
      </div>
    )

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="page-title">{t('nav.flashcards')}</h1>
        <p className="muted">{t('cards.intro')}</p>
      </div>
      <section className="card space-y-4">
        <label className="block text-sm font-semibold">
          {t('train.course')}
          <select className="input mt-1" value={course} onChange={(e) => setParams(e.target.value === 'alle' ? {} : { kursus: e.target.value })}>
            <option value="alle">{t('train.allCourses')}</option>
            {data.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title} ({c.cards.length})
              </option>
            ))}
          </select>
        </label>
        <div className="segmented" role="radiogroup" aria-label={t('cards.modeLabel')}>
          {(['flip', 'type'] as Mode[]).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} className={mode === m ? 'seg seg-on' : 'seg'} onClick={() => setMode(m)}>
              {t(m === 'flip' ? 'cards.flipMode' : 'cards.typeMode')}
            </button>
          ))}
        </div>
        <p className="text-sm">{ready.length ? t('cards.ready', { due, fresh: ready.length - due }) : t('cards.none')}</p>
        <button className="btn btn-primary w-full py-2.5 text-base" disabled={!ready.length} onClick={() => setSession({ cards: ready, i: 0, right: 0 })}>
          {t('cards.start')}
        </button>
      </section>
      <p className="muted text-sm">
        {t('cards.sources')} <Link className="link" to="/ordliste">{t('nav.glossary')}</Link>.
      </p>
    </div>
  )
}

function Review({ card, n, total, mode, onStop, onDone }: { card: Flashcard; n: number; total: number; mode: Mode; onStop: () => void; onDone: (ok: boolean) => void }) {
  const t = useT()
  const store = useStore()
  const [flipped, setFlipped] = useState(false)
  const [typed, setTyped] = useState('')
  const [verdict, setVerdict] = useState<'exact' | 'close' | 'wrong' | null>(null)
  const typing = mode === 'type' && !!card.answer
  const rate = async (rating: Rating) => {
    const now = Date.now()
    const prev = (await store.get('srs', card.id)) || newCard(card.id, now)
    await store.put('srs', review(prev, rating, now))
    onDone(rating >= 2)
  }
  const prompt = useMemo(() => t(card.kind === 'da-en' ? 'cards.toEnglish' : card.kind === 'en-da' ? 'cards.toDanish' : card.kind === 'definition' ? 'cards.define' : 'cards.formula'), [card.kind, t])
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <button className="btn" onClick={onStop}>
          {t('train.stop')}
        </button>
        <span className="chip">{t('cards.of', { n, total })}</span>
      </div>
      <section className="card space-y-4 text-center" aria-live="polite">
        <div className="muted text-xs font-semibold uppercase tracking-wide">{prompt}</div>
        <div className="prose-content text-xl font-semibold" dangerouslySetInnerHTML={{ __html: card.front }} />
        {(flipped || verdict) && (
          <div className="fade-in border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <div className="prose-content text-lg" dangerouslySetInnerHTML={{ __html: card.back }} />
          </div>
        )}
      </section>
      {typing ? (
        verdict === null ? (
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              if (typed.trim()) setVerdict(checkTyped(card, typed))
            }}
          >
            <input className="input" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} aria-label={t('answer.yours')} autoComplete="off" />
            <button className="btn btn-primary shrink-0" type="submit" disabled={!typed.trim()}>
              {t('answer.check')}
            </button>
          </form>
        ) : (
          <div className="space-y-3 text-center">
            <p role="status" className="font-medium" style={{ color: verdict === 'wrong' ? 'var(--text)' : 'var(--ok)' }}>
              {verdict === 'exact' ? t('answer.right') : verdict === 'close' ? t('cards.close') : t('cards.wrong')}
            </p>
            <button className="btn btn-primary" autoFocus onClick={() => rate(verdict === 'exact' ? 3 : verdict === 'close' ? 2 : 0)}>
              {t('test.next')}
            </button>
          </div>
        )
      ) : !flipped ? (
        <div className="text-center">
          <button className="btn btn-primary" autoFocus onClick={() => setFlipped(true)}>
            {t('cards.flip')}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t('exercise.rateYourself')}>
          {([0, 1, 2, 3] as Rating[]).map((r) => (
            <button key={r} className="btn" onClick={() => rate(r)}>
              {t(RATING_LABEL[r])}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
