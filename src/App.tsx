import { HashRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { StoreProvider } from '@/lib/store'
import { useTheme } from '@/components/ThemeToggle'
import Dashboard from '@/pages/Dashboard'
import Courses from '@/pages/Courses'
import CoursePage from '@/pages/CoursePage'
import WeekPage from '@/pages/WeekPage'
import ExercisePage from '@/pages/ExercisePage'
import SetPage from '@/pages/SetPage'
import ProjectPage from '@/pages/ProjectPage'
import InfoPage from '@/pages/InfoPage'
import SearchPage from '@/pages/SearchPage'
import GlossaryPage from '@/pages/GlossaryPage'
import LogbookPage from '@/pages/LogbookPage'
import SettingsPage, { AutoSync } from '@/pages/SettingsPage'
import NotFound from '@/pages/NotFound'

const TrainPage = lazy(() => import('@/pages/TrainPage'))
const InteractivesPage = lazy(() => import('@/pages/InteractivesPage'))
const StatsPage = lazy(() => import('@/pages/StatsPage'))

const NAV = [
  { to: '/', label: 'Overblik', icon: '⌂', end: true },
  { to: '/kurser', label: 'Kurser', icon: '▤' },
  { to: '/traen', label: 'Træn', icon: '◎' },
]

const MORE = [
  { to: '/soeg', label: 'Søg' },
  { to: '/statistik', label: 'Statistik' },
  { to: '/ordliste', label: 'Ordliste' },
  { to: '/logbog', label: 'Logbog' },
  { to: '/interaktivt', label: 'Prøv selv' },
  { to: '/indstillinger', label: 'Indstillinger' },
]

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function MoreMenu({ placement }: { placement: 'down' | 'up' }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => (document.removeEventListener('mousedown', close), document.removeEventListener('keydown', esc))
  }, [open])
  const active = MORE.some((m) => pathname.startsWith(m.to))
  return (
    <div ref={ref} className="relative">
      <button
        className={`nav-item ${active ? 'nav-active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {placement === 'up' && <span className="nav-icon" aria-hidden>⋯</span>}
        <span>Mere</span>
        {placement === 'down' && <span aria-hidden className="text-xs">▾</span>}
      </button>
      {open && (
        <div role="menu" className={`menu ${placement === 'up' ? 'bottom-full right-0 mb-2' : 'right-0 top-full mt-2'}`}>
          {MORE.map((m) => (
            <NavLink key={m.to} role="menuitem" to={m.to} className={({ isActive }) => `menu-item ${isActive ? 'nav-active' : ''}`}>
              {m.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

function Header() {
  return (
    <>
      <header className="app-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight" aria-label="Læring — forside">
            <span className="grid h-8 w-8 place-items-center rounded-lg text-base text-white" style={{ background: 'var(--accent)', fontFamily: 'Georgia, serif' }}>
              ∑
            </span>
            <span>Læring</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Hovedmenu">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                {n.label}
              </NavLink>
            ))}
            <MoreMenu placement="down" />
          </nav>
          <Link to="/soeg" className="icon-btn ml-auto" aria-label="Søg" title="Søg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
        </div>
      </header>
      {/* Phones: the same four items as a bottom tab bar. */}
      <nav className="tabbar md:hidden" aria-label="Hovedmenu">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
            <span className="nav-icon" aria-hidden>
              {n.icon}
            </span>
            <span>{n.label}</span>
          </NavLink>
        ))}
        <MoreMenu placement="up" />
      </nav>
    </>
  )
}

function ThemeApplier() {
  useTheme()
  return null
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollToTop />
        <AutoSync />
        <ThemeApplier />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 btn">
          Spring til indhold
        </a>
        <Header />
        <main id="main" className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-16">
          <Suspense fallback={<p className="muted">Indlæser…</p>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/kurser" element={<Courses />} />
              <Route path="/kursus/:slug" element={<CoursePage />} />
              <Route path="/kursus/:slug/uge/:week" element={<WeekPage />} />
              <Route path="/kursus/:slug/uge/:week/opgave/:num" element={<ExercisePage />} />
              <Route path="/kursus/:slug/saet/:set" element={<SetPage />} />
              <Route path="/kursus/:slug/projekt" element={<ProjectPage />} />
              <Route path="/kursus/:slug/info/:page" element={<InfoPage />} />
              <Route path="/traen" element={<TrainPage />} />
              <Route path="/soeg" element={<SearchPage />} />
              <Route path="/ordliste" element={<GlossaryPage />} />
              <Route path="/logbog" element={<LogbookPage />} />
              <Route path="/indstillinger" element={<SettingsPage />} />
              <Route path="/interaktivt" element={<InteractivesPage />} />
              <Route path="/statistik" element={<StatsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </HashRouter>
    </StoreProvider>
  )
}
