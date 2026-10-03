import { useEffect } from 'react'
import { useSetting } from '@/lib/store'

export type ThemePref = 'system' | 'light' | 'dark'

export function applyTheme(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  try {
    localStorage.setItem('lp-theme', pref)
  } catch {
    /* private mode */
  }
}

export function useTheme(): [ThemePref, (t: ThemePref) => void] {
  const [pref, setPref, loaded] = useSetting<ThemePref>('theme', 'system')
  useEffect(() => {
    if (!loaded) return
    applyTheme(pref)
    if (pref !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => applyTheme('system')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [pref, loaded])
  return [pref, setPref]
}

