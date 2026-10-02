import { describe, expect, it } from 'vitest'
import { dayKey, goalStatus } from '@/lib/goals'

const DAY = 86_400_000
const noon = new Date('2026-10-02T12:00:00').getTime()
const at = (daysAgo: number, ex: string, hour = 12) => ({ ts: noon - daysAgo * DAY + (hour - 12) * 3_600_000, exerciseId: ex })
const day = (daysAgo: number, n: number) => Array.from({ length: n }, (_, i) => at(daysAgo, `ex${daysAgo}-${i}`))

describe('daily goal and streak', () => {
  it('counts distinct exercises today', () => {
    const s = goalStatus([at(0, 'a'), at(0, 'a'), at(0, 'b'), at(1, 'c')], 3, noon)
    expect(s.today).toBe(2)
    expect(s.reached).toBe(false)
  })
  it('counts days in a row, including today once the goal is reached', () => {
    const attempts = [...day(0, 3), ...day(1, 3), ...day(2, 4), ...day(4, 3)]
    expect(goalStatus(attempts, 3, noon).streak).toBe(3)
  })
  it('keeps yesterday’s streak alive while today is still open', () => {
    const attempts = [...day(0, 1), ...day(1, 3), ...day(2, 3)]
    const s = goalStatus(attempts, 3, noon)
    expect(s.streak).toBe(2)
    expect(s.reached).toBe(false)
  })
  it('starts fresh after a missed day, and remembers the best streak', () => {
    const attempts = [...day(3, 3), ...day(4, 3), ...day(5, 3), ...day(6, 3)]
    const s = goalStatus(attempts, 3, noon)
    expect(s.streak).toBe(0)
    expect(s.best).toBe(4)
  })
  it('uses local calendar days', () => {
    expect(dayKey(new Date('2026-10-02T23:59:00').getTime())).toBe('2026-10-02')
    expect(dayKey(new Date('2026-10-03T00:01:00').getTime())).toBe('2026-10-03')
  })
})
