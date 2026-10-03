import { useSetting, useTable } from '@/lib/store'
import { DEFAULT_GOAL, GOAL_CHOICES, GOAL_KEY, goalStatus, type GoalSettings } from '@/lib/goals'

/** Today's goal as a small ring, plus the streak. Renders nothing when switched off. */
export function DailyGoal({ compact = false }: { compact?: boolean }) {
  const [goal] = useSetting<GoalSettings>(GOAL_KEY, DEFAULT_GOAL)
  const attempts = useTable('attempts')
  if (!goal.enabled || !attempts) return null
  const s = goalStatus(attempts, goal.perDay, Date.now())
  const pct = Math.min(1, s.today / s.goal)
  const r = 15
  const c = 2 * Math.PI * r
  return (
    <div className={`flex items-center gap-3 ${compact ? 'text-xs' : 'text-sm'}`} aria-label={`Dagens mål: ${s.today} af ${s.goal} opgaver`}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden className="shrink-0">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={s.reached ? 'var(--ok)' : 'var(--accent)'} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 20 20)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text)">
          {s.reached ? '✓' : s.today}
        </text>
      </svg>
      <div className="min-w-0">
        <div className="font-medium">{s.reached ? 'Dagens mål er nået' : `${s.today} af ${s.goal} opgaver i dag`}</div>
        <div className="muted">{s.streak > 1 ? `${s.streak} dage i træk` : s.streak === 1 ? '1 dag i træk' : s.best > 1 ? 'En ny start — din bedste stribe er ' + s.best + ' dage' : 'Hver dag tæller'}</div>
      </div>
    </div>
  )
}

/** Settings: turn the goal on/off and choose the size. */
export function DailyGoalSettings() {
  const [goal, setGoal] = useSetting<GoalSettings>(GOAL_KEY, DEFAULT_GOAL)
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={goal.enabled} onChange={(e) => setGoal({ ...goal, enabled: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
        Vis et dagligt mål og hvor mange dage i træk, du har nået det
      </label>
      {goal.enabled && (
        <div className="segmented" role="radiogroup" aria-label="Opgaver om dagen">
          {GOAL_CHOICES.map((n) => (
            <button key={n} role="radio" aria-checked={goal.perDay === n} className={goal.perDay === n ? 'seg seg-on' : 'seg'} onClick={() => setGoal({ ...goal, perDay: n })}>
              {n} {n === 1 ? 'opgave' : 'opgaver'} om dagen
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
