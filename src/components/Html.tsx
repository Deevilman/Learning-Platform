// Renders pre-built HTML from the content pipeline and "hydrates" it:
// interactive components, Mermaid diagrams and code-block tools (run Python,
// open Lean, copy).

import { useEffect, useRef, useState, lazy, Suspense, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { interactiveLoaders } from '@/lib/interactives'
import { hasRunner, externalPlayground } from '@/lib/runners'
import { CodeRunPanel } from './CodeRunPanel'

let mermaidReady: Promise<typeof import('mermaid').default> | null = null
let mermaidCount = 0
function loadMermaid() {
  if (!mermaidReady)
    mermaidReady = import('mermaid').then((m) => {
      m.default.initialize({ startOnLoad: false, securityLevel: 'strict', theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default' })
      return m.default
    })
  return mermaidReady
}

const lazyCache = new Map<string, ReturnType<typeof lazy>>()
function lazyInteractive(id: string) {
  let c = lazyCache.get(id)
  if (!c) {
    const loader = interactiveLoaders.get(id)
    c = lazy(async () => (loader ? loader() : { default: () => createElement('div', { className: 'chip' }, `Ukendt komponent: ${id}`) }))
    lazyCache.set(id, c)
  }
  return c
}

function InteractiveHost({ id, props }: { id: string; props: Record<string, string> }) {
  const C = lazyInteractive(id)
  return (
    <Suspense fallback={<div className="widget muted text-sm">Indlæser interaktiv komponent…</div>}>
      <C props={props} />
    </Suspense>
  )
}

export function Html({ html, className = '' }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Every run mounts into fresh host elements, so StrictMode's double
    // effects and re-renders never share a React root.
    const roots: { root: Root; host: HTMLElement }[] = []
    const mount = (parent: Element, node: React.ReactNode, where: 'inside' | 'after' = 'inside', cls = 'hydrated') => {
      const host = document.createElement('div')
      host.className = cls
      if (where === 'inside') parent.appendChild(host)
      else parent.after(host)
      const root = createRoot(host)
      root.render(node)
      roots.push({ root, host })
    }

    // Interactive components
    el.querySelectorAll<HTMLElement>('div.interactive[data-interactive]').forEach((div) => {
      let props: Record<string, string> = {}
      try {
        props = JSON.parse(div.dataset.props || '{}')
      } catch {
        /* ignore */
      }
      mount(div, <InteractiveHost id={div.dataset.interactive!} props={props} />)
    })

    // Mermaid
    const diagrams = el.querySelectorAll<HTMLElement>('div.mermaid-src')
    if (diagrams.length)
      loadMermaid().then(async (mermaid) => {
        for (const d of diagrams) {
          if (d.dataset.done) continue
          try {
            const { svg } = await mermaid.render(`mmd-${++mermaidCount}`, d.dataset.mermaid || '')
            d.innerHTML = svg
            d.classList.add('mermaid-box')
            d.dataset.done = '1'
          } catch {
            d.innerHTML = `<pre>${(d.dataset.mermaid || '').replace(/</g, '&lt;')}</pre>`
          }
        }
      })

    // Code blocks
    el.querySelectorAll<HTMLElement>('pre.code-block').forEach((pre) => {
      const lang = pre.dataset.lang || 'text'
      const code = pre.textContent || ''
      if (lang === 'text' && !/^(def |import |from |print\()/m.test(code)) return
      mount(pre, <CodeTools lang={lang} code={code} />, 'after', 'code-tools-host')
    })

    return () => {
      for (const { host } of roots) host.style.display = 'none'
      // Unmount after the current commit to avoid React warnings.
      setTimeout(() =>
        roots.forEach(({ root, host }) => {
          root.unmount()
          host.remove()
        }),
      )
    }
  }, [html])

  return <div ref={ref} className={`prose-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
}

function CodeTools({ lang, code }: { lang: string; code: string }) {
  const [run, setRun] = useState(0)
  const [copied, setCopied] = useState(false)
  const playground = externalPlayground(lang, code)
  const runnable = hasRunner(lang)
  return (
    <div>
      <div className="code-tools">
        {runnable && <button onClick={() => setRun((n) => n + 1)}>▶ Kør i browseren</button>}
        {playground && (
          <a href={playground.url} target="_blank" rel="noopener noreferrer">
            {playground.label} ↗
          </a>
        )}
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
        >
          {copied ? 'Kopieret ✓' : 'Kopiér'}
        </button>
      </div>
      {run > 0 && <CodeRunPanel key={run} lang={lang} code={code} />}
    </div>
  )
}
