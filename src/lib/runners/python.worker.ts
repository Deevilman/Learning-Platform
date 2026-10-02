/// <reference lib="webworker" />
// Classic worker: loads Pyodide with importScripts and runs code on request.

declare function importScripts(...urls: string[]): void
declare function loadPyodide(opts: Record<string, unknown>): Promise<any>

let pyodide: any = null

self.onmessage = async (e: MessageEvent) => {
  const m = e.data
  if (m.type === 'init') {
    try {
      importScripts(m.indexURL + 'pyodide.js')
      pyodide = await loadPyodide({ indexURL: m.indexURL })
      ;(self as any).postMessage({ type: 'ready' })
    } catch (err) {
      ;(self as any).postMessage({ type: 'init-error', error: String((err as Error)?.message || err) })
    }
    return
  }
  if (m.type === 'run') {
    let stdout = ''
    let stderr = ''
    pyodide.setStdout({ batched: (s: string) => (stdout += s + '\n') })
    pyodide.setStderr({ batched: (s: string) => (stderr += s + '\n') })
    try {
      const imports: string[] = pyodide.pyimport('pyodide.code').find_imports(m.code).toJs()
      const missing = imports.filter((x: string) => ['numpy', 'pandas', 'scipy', 'matplotlib', 'sympy', 'networkx'].includes(x))
      if (missing.length) {
        ;(self as any).postMessage({ type: 'status', text: `Henter ${missing.join(', ')}…` })
        await pyodide.loadPackagesFromImports(m.code)
      }
      // Fresh globals per run so runs don't leak into each other.
      const globals = pyodide.toPy({ __name__: '__main__' })
      await pyodide.runPythonAsync(m.code, { globals })
      globals.destroy()
      ;(self as any).postMessage({ type: 'result', id: m.id, stdout, stderr })
    } catch (err) {
      ;(self as any).postMessage({ type: 'result', id: m.id, stdout, stderr, error: String((err as Error)?.message || err) })
    }
  }
}
