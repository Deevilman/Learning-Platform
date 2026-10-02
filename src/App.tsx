import { HashRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { StoreProvider } from '@/lib/store'
import { ThemeToggle } from '@/components/ThemeToggle'
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

const NAV = [
  { to: '/', label: 'Overblik', end: true },
  { to: '/kurser', label: 'Kurser' },
  { to: '/traen', label: 'Træn' },
  { to: '/soeg', label: 'Søg' },
  { to: '/ordliste', label: 'Ordliste' },
  { to: '/logbog', label: 'Logbog' },
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

function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  return (
    <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 85%, transparent)' }}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight" aria-label="Det seje — forside">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-lg text-white" style={{ background: 'var(--accent)', fontFamily: 'Georgia, serif' }}>
            ∑
          </span>
          <span>Det seje</span>
        </Link>
        <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex" aria-label="Hovedmenu">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `rounded-md px-2.5 py-1.5 text-sm font-medium ${isActive ? '' : 'muted hover:opacity-80'}`}
              style={({ isActive }) => (isActive ? { background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined)}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          <button className="btn md:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
            {open ? 'Luk' : 'Menu'}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="border-t px-4 py-2 md:hidden" style={{ borderColor: 'var(--border)' }} aria-label="Mobilmenu">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `block rounded-md px-2 py-2 text-sm ${isActive ? 'font-semibold' : ''}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollToTop />
        <AutoSync />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 btn">
          Spring til indhold
        </a>
        <Header />
        <main id="main" className="mx-auto max-w-6xl px-4 pb-24 pt-6">
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </HashRouter>
    </StoreProvider>
  )
}
