import { useSetting } from '@/lib/store'
import { ANSWER_PREF_KEY, ANSWER_PREF_LABEL, type AnswerPref } from '@/lib/answer-type'

/** "Opgavetype": how you want to answer. Shared by Træn, the week's exercises and Indstillinger. */
export function AnswerPrefPicker({ compact = false }: { compact?: boolean }) {
  const [pref, setPref] = useSetting<AnswerPref>(ANSWER_PREF_KEY, 'blandet')
  return (
    <div className={compact ? 'flex flex-wrap items-center gap-2 text-sm' : 'space-y-2'}>
      <span className={compact ? 'muted' : 'block text-sm font-semibold'} id="answer-pref-label">
        Opgavetype{compact ? ':' : ''}
      </span>
      <div className="segmented" role="radiogroup" aria-labelledby="answer-pref-label">
        {(Object.keys(ANSWER_PREF_LABEL) as AnswerPref[]).map((p) => (
          <button key={p} role="radio" aria-checked={pref === p} className={pref === p ? 'seg seg-on' : 'seg'} onClick={() => setPref(p)}>
            {ANSWER_PREF_LABEL[p]}
          </button>
        ))}
      </div>
    </div>
  )
}
