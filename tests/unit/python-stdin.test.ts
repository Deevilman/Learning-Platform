// Large standard input reaches Python whole (it was cut off after 8 KB).
import { describe, it, expect, beforeAll } from 'vitest'
import { loadPyodide, type PyodideInterface } from 'pyodide'
import { stdinReader } from '@/lib/runners/stdin'
import { join } from 'node:path'

describe('Python standard input', () => {
  let py: PyodideInterface
  const run = (code: string, input: string) => {
    let out = ''
    py.setStdout({ batched: (s: string) => (out += s + '\n') })
    py.setStdin(stdinReader(input))
    py.runPython(code)
    return out.trim()
  }
  beforeAll(async () => {
    py = await loadPyodide({ indexURL: join(import.meta.dirname, '../../node_modules/pyodide') })
  }, 120000)

  it('sys.stdin.read() gets all of 100 KB', () => {
    const nums = Array.from({ length: 20000 }, (_, i) => i % 1000)
    const input = nums.join(' ') + '\n'
    expect(input.length).toBeGreaterThan(70000)
    const big = input.repeat(2)
    expect(big.length).toBeGreaterThan(100000)
    expect(run('import sys\nd = sys.stdin.read().split()\nprint(len(d), sum(map(int, d)))', big)).toBe(`40000 ${2 * nums.reduce((a, b) => a + b, 0)}`)
  })

  it('input() reads many long lines, then EOFError', () => {
    const lines = Array.from({ length: 200 }, (_, i) => `${i} ` + 'æx'.repeat(300))
    const code = 'n = 0\ntry:\n    while True:\n        s = input()\n        n += len(s)\nexcept EOFError:\n    print("eof", n)'
    expect(run(code, lines.join('\n') + '\n')).toBe(`eof ${lines.reduce((a, l) => a + l.length, 0)}`)
  })
})
