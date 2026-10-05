// Syncs progress and uploaded courses in the background while signed in:
// shortly after start, every 5 minutes and when the tab is hidden.

import { useEffect, useRef } from 'react'
import { useSetting, useStore } from '@/lib/store'
import { getSession, syncNow } from '@/lib/storage/supabase-sync'
import { syncCourses } from '@/lib/courses/cloud'

export function AutoSync() {
  const store = useStore()
  const [auto, , loaded] = useSetting('sync.auto', true)
  const busy = useRef(false)
  useEffect(() => {
    if (!loaded || !auto) return
    let stopped = false
    const tick = async () => {
      if (busy.current || stopped) return
      busy.current = true
      try {
        if (await getSession()) {
          await syncNow(store)
          await syncCourses().catch(() => null)
        }
      } catch {
        /* offline or not configured — try again later */
      } finally {
        busy.current = false
      }
    }
    const first = setTimeout(tick, 2000)
    const timer = setInterval(tick, 5 * 60 * 1000)
    const onHide = () => document.visibilityState === 'hidden' && tick()
    document.addEventListener('visibilitychange', onHide)
    return () => {
      stopped = true
      clearTimeout(first)
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [auto, loaded, store])
  return null
}
