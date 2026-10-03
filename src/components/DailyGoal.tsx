import { useSetting, useTable } from '@/lib/store'
import { DEFAULT_GOAL, GOAL_CHOICES, GOAL_KEY, goalStatus, type GoalSettings } from '@/lib/goals'
import { useT } from '@/i18n'

/** Today's goal as a small ring, plus the streak. Renders nothing when switched off. */
export function DailyGoal({ compact = false }: { compact?: boolean }) {
  const t = useT()
  const [goal] = useSetting<GoalSettings>(GOAL_KEY, DEFAULT_GOAL)
  const attempts = useTable('attempts')
  if (!goal.enabled || !attempts) return null
  const s = goalStatus(attempts, goal.perDay, Date.now())
  const pct = Math.min(1, s.today / s.goal)
  const r = 15
  const c = 2 * Math.PI * r
  return (
    <div className={`flex items-center gap-3 ${compact ? 'text-xs' : 'text-sm'}`} aria-label={t('goal.aria', { n: s.today, goal: s.goal })}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden className="shrink-0">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={s.reached ? 'var(--ok)' : 'var(--accent)'} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 20 20)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text)">
          {s.reached ? '✓' : s.today}
        </text>
      </svg>
      <div className="min-w-0">
        <div className="font-medium">{s.reached ? t('goal.reached') : t('goal.today', { n: s.today, goal: s.goal })}</div>
        <div className="muted">{s.streak > 1 ? t('goal.streak', { n: s.streak }) : s.streak === 1 ? t('goal.streakOne') : s.best > 1 ? t('goal.newStart', { n: s.best }) : t('goal.everyDay')}</div>
      </div>
    </div>
  )
}

/** Settings: turn the goal on/off and choose the size. */
export function DailyGoalSettings() {
  const t = useT()
  const [goal, setGoal] = useSetting<GoalSettings>(GOAL_KEY, DEFAULT_GOAL)
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={goal.enabled} onChange={(e) => setGoal({ ...goal, enabled: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
        {t('goal.show')}
      </label>
      {goal.enabled && (
        <div className="segmented" role="radiogroup" aria-label={t('goal.perDayLabel')}>
          {GOAL_CHOICES.map((n) => (
            <button key={n} role="radio" aria-checked={goal.perDay === n} className={goal.perDay === n ? 'seg seg-on' : 'seg'} onClick={() => setGoal({ ...goal, perDay: n })}>
              {t(n === 1 ? 'goal.perDayOne' : 'goal.perDay', { n })}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
