// Runs the content build in a child process. A full build takes over a minute
// on CI, and done in the test worker it blocks the worker so long that vitest's
// own messages time out ("Timeout calling onTaskUpdate") and the run fails.

import { execFile } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { BuildOptions, BuildReport } from '../../scripts/build-content'

const ROOT = join(import.meta.dirname, '../..')

export function buildContentInChild(opts: BuildOptions): Promise<BuildReport> {
  const dir = mkdtempSync(join(tmpdir(), 'lp-report-'))
  const file = join(dir, 'report.json')
  const script = `import { buildContent } from ${JSON.stringify(join(ROOT, 'scripts/build-content.ts'))}
import { writeFileSync } from 'node:fs'
writeFileSync(${JSON.stringify(file)}, JSON.stringify(buildContent(${JSON.stringify(opts)})))`
  return new Promise((resolve, reject) => {
    execFile(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], { cwd: ROOT, maxBuffer: 64 << 20 }, (err, _out, stderr) => {
      if (err) return reject(new Error(`content build failed: ${stderr || err.message}`))
      try {
        resolve(JSON.parse(readFileSync(file, 'utf8')))
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    })
  })
}
