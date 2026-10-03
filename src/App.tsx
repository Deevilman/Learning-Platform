import { HashRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { StoreProvider } from '@/lib/store'
import { useTheme } from '@/components/ThemeToggle'
import { LangApplier, LANGS, useLang, useT, type Key } from '@/i18n'
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
const PlacementPage = lazy(() => import('@/pages/PlacementPage'))
const AddCoursePage = lazy(() => import('@/pages/AddCoursePage'))
const FlashcardsPage = lazy(() => import('@/pages/FlashcardsPage'))

const NAV: { to: string; label: Key; icon: string; end?: boolean }[] = [
  { to: '/', label: 'nav.overview', icon: '⌂', end: true },
  { to: '/kurser', label: 'nav.courses', icon: '▤' },
  { to: '/traen', label: 'nav.train', icon: '◎' },
]

const MORE = [
  { to: '/soeg', label: 'nav.search' },
  { to: '/statistik', label: 'nav.stats' },
  { to: '/ordliste', label: 'nav.glossary' },
  { to: '/kort', label: 'nav.flashcards' },
  { to: '/logbog', label: 'nav.logbook' },
  { to: '/interaktivt', label: 'nav.tryIt' },
  { to: '/kurser/tilfoej', label: 'nav.addCourse' },
  { to: '/indstillinger', label: 'nav.settings' },
] as const

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
  const t = useT()
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
        <span>{t('nav.more')}</span>
        {placement === 'down' && <span aria-hidden className="text-xs">▾</span>}
      </button>
      {open && (
        <div role="menu" className={`menu ${placement === 'up' ? 'bottom-full right-0 mb-2' : 'right-0 top-full mt-2'}`}>
          {MORE.map((m) => (
            <NavLink key={m.to} role="menuitem" to={m.to} className={({ isActive }) => `menu-item ${isActive ? 'nav-active' : ''}`}>
              {t(m.label)}
            </NavLink>
          ))}
          <LangSwitch />
        </div>
      )}
    </div>
  )
}

/** Dansk | English, at the bottom of the Mere menu (also under Indstillinger). */
function LangSwitch() {
  const t = useT()
  const [lang, setLang] = useLang()
  return (
    <div className="flex gap-1 border-t px-2 pt-2" style={{ borderColor: 'var(--border)' }} role="group" aria-label={t('lang.label')}>
      {LANGS.map((l) => (
        <button key={l} lang={l} role="menuitemradio" aria-checked={lang === l} className={lang === l ? 'seg seg-on' : 'seg'} onClick={() => setLang(l)}>
          {t(l === 'da' ? 'lang.da' : 'lang.en')}
        </button>
      ))}
    </div>
  )
}

function Header() {
  const t = useT()
  return (
    <>
      <header className="app-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight" aria-label={t('app.home')}>
            <span className="grid h-8 w-8 place-items-center rounded-lg text-base text-white" style={{ background: 'var(--accent)', fontFamily: 'Georgia, serif' }}>
              ∑
            </span>
            <span>{t('app.name')}</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label={t('nav.main')}>
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
                {t(n.label)}
              </NavLink>
            ))}
            <MoreMenu placement="down" />
          </nav>
          <Link to="/soeg" className="icon-btn ml-auto" aria-label={t('nav.search')} title={t('nav.search')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
        </div>
      </header>
      {/* Phones: the same four items as a bottom tab bar. */}
      <nav className="tabbar md:hidden" aria-label={t('nav.main')}>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}>
            <span className="nav-icon" aria-hidden>
              {n.icon}
            </span>
            <span>{t(n.label)}</span>
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

function SkipLink() {
  const t = useT()
  return (
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 btn">
      {t('app.skip')}
    </a>
  )
}

function LoadingFallback() {
  const t = useT()
  return <p className="muted">{t('app.loading')}</p>
}

/** Pages are remounted when the language changes, so they load the course in the new language. */
function LangRoutes({ children }: { children: React.ReactNode }) {
  const [lang] = useLang()
  return <Routes key={lang}>{children}</Routes>
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollToTop />
        <AutoSync />
        <ThemeApplier />
        <LangApplier />
        <SkipLink />
        <Header />
        <main id="main" className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-16">
          <Suspense fallback={<LoadingFallback />}>
            <LangRoutes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/kurser" element={<Courses />} />
              <Route path="/kurser/tilfoej" element={<AddCoursePage />} />
              <Route path="/kursus/:slug" element={<CoursePage />} />
              <Route path="/kursus/:slug/test" element={<PlacementPage />} />
              <Route path="/kursus/:slug/uge/:week" element={<WeekPage />} />
              <Route path="/kursus/:slug/uge/:week/opgave/:num" element={<ExercisePage />} />
              <Route path="/kursus/:slug/saet/:set" element={<SetPage />} />
              <Route path="/kursus/:slug/projekt" element={<ProjectPage />} />
              <Route path="/kursus/:slug/info/:page" element={<InfoPage />} />
              <Route path="/traen" element={<TrainPage />} />
              <Route path="/soeg" element={<SearchPage />} />
              <Route path="/ordliste" element={<GlossaryPage />} />
              <Route path="/kort" element={<FlashcardsPage />} />
              <Route path="/logbog" element={<LogbookPage />} />
              <Route path="/indstillinger" element={<SettingsPage />} />
              <Route path="/interaktivt" element={<InteractivesPage />} />
              <Route path="/statistik" element={<StatsPage />} />
              <Route path="*" element={<NotFound />} />
            </LangRoutes>
          </Suspense>
        </main>
      </HashRouter>
    </StoreProvider>
  )
}
