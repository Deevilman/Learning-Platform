// Copies the Pyodide core files into public/pyodide so the site self-hosts
// Python (no third-party CDN needed for standard-library code).
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const src = join(root, 'node_modules/pyodide')
const dst = join(root, 'public/pyodide')
const files = ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']
if (!existsSync(src)) {
  console.warn('! pyodide ikke installeret — Python-kørsel virker ikke')
  process.exit(0)
}
mkdirSync(dst, { recursive: true })
for (const f of files) cpSync(join(src, f), join(dst, f))
// Packages (numpy, …) are not self-hosted: point their wheels at the CDN.
const version = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8')).version
const lock = JSON.parse(readFileSync(join(dst, 'pyodide-lock.json'), 'utf8'))
for (const pkg of Object.values<any>(lock.packages)) if (!/^https?:/.test(pkg.file_name)) pkg.file_name = `https://cdn.jsdelivr.net/pyodide/v${version}/full/${pkg.file_name}`
writeFileSync(join(dst, 'pyodide-lock.json'), JSON.stringify(lock))
console.log(`✓ Pyodide kopieret til public/pyodide (${files.length} filer)`)
