// Python via Pyodide in a Web Worker. Self-hosted Pyodide core (copied to
// /pyodide by scripts/copy-pyodide.ts); extra packages such as numpy are
// fetched from the Pyodide CDN on demand (the copied lock file points there).

import type { CodeRunner, RunOptions, RunResult } from './types'
import { tr } from '@/i18n/translate'

let worker: Worker | null = null
let ready: Promise<void> | null = null
let seq = 0
const pending = new Map<number, { resolve: (r: RunResult) => void; started: number }>()
let statusCb: ((s: string) => void) | undefined

function start() {
  const indexURL = new URL(import.meta.env.BASE_URL.replace(/\/?$/, '/') + 'pyodide/', location.href).href
  worker = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'classic' })
  ready = new Promise((resolve, reject) => {
    worker!.onmessage = (e) => {
      const m = e.data
      if (m.type === 'ready') resolve()
      else if (m.type === 'init-error') reject(new Error(m.error))
      else if (m.type === 'status') statusCb?.(tr('run.fetching', { list: m.packages.join(', ') }))
      else if (m.type === 'result') {
        const p = pending.get(m.id)
        if (p) {
          pending.delete(m.id)
          p.resolve({ stdout: m.stdout, stderr: m.stderr, error: m.error, ms: Date.now() - p.started })
        }
      }
    }
    worker!.onerror = (e) => reject(new Error(e.message || tr('run.crashed')))
  })
  worker.postMessage({ type: 'init', indexURL })
}

function kill() {
  worker?.terminate()
  worker = null
  ready = null
}

export const pythonRunner: CodeRunner = {
  language: 'python',
  label: 'Python',
  async run(code: string, opts: RunOptions = {}): Promise<RunResult> {
    const timeoutMs = opts.timeoutMs ?? 60000
    statusCb = opts.onStatus
    if (!worker) {
      opts.onStatus?.(tr('run.loading'))
      start()
    }
    try {
      await ready
    } catch (e) {
      kill()
      return { stdout: '', stderr: '', error: tr('run.noStart', { error: (e as Error).message }), ms: 0 }
    }
    opts.onStatus?.(tr('run.running'))
    const id = ++seq
    const started = Date.now()
    return new Promise<RunResult>((resolve) => {
      const timer = setTimeout(() => {
        if (!pending.has(id)) return
        pending.delete(id)
        kill() // the only way to stop a busy worker
        resolve({ stdout: '', stderr: '', error: tr('run.timeout', { n: timeoutMs / 1000 }), timedOut: true, ms: Date.now() - started })
      }, timeoutMs)
      pending.set(id, {
        started,
        resolve: (r) => {
          clearTimeout(timer)
          resolve(r)
        },
      })
      worker!.postMessage({ type: 'run', id, code, stdin: opts.stdin })
    })
  },
}
