// Runs a reference solution on this machine during the content build
// (Node only): python3, gcc, g++, mcs/mono (C#) and nasm/ld (x86-64).
// The browser never runs this; learners' code goes to the judge.

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { JudgeLanguage, ProblemTest } from '../../src/types/content.ts'
import { sameOutput } from './problems.ts'

const has = (cmd: string) => spawnSync('sh', ['-c', `command -v ${cmd}`]).status === 0

const TOOLS: Record<JudgeLanguage, string[]> = { python: ['python3'], c: ['gcc'], cpp: ['g++'], csharp: ['mcs', 'mono'], nasm: ['nasm', 'ld'] }

export const toolchainAvailable = (lang: JudgeLanguage) => TOOLS[lang].every(has)

/** Compile (if needed) and return the command that runs the program. */
function prepare(lang: JudgeLanguage, code: string, dir: string): { run: string[] } | { error: string } {
  const sh = (cmd: string[]) => spawnSync(cmd[0], cmd.slice(1), { cwd: dir, encoding: 'utf8', timeout: 30_000 })
  const fail = (r: ReturnType<typeof sh>) => (r.status !== 0 ? { error: `kunne ikke oversættes: ${(r.stderr || r.stdout || '').slice(0, 400)}` } : null)
  switch (lang) {
    case 'python':
      writeFileSync(join(dir, 'main.py'), code)
      return { run: ['python3', 'main.py'] }
    case 'c': {
      writeFileSync(join(dir, 'main.c'), code)
      return fail(sh(['gcc', '-O2', '-std=c17', '-o', 'main', 'main.c', '-lm'])) || { run: ['./main'] }
    }
    case 'cpp': {
      writeFileSync(join(dir, 'main.cpp'), code)
      return fail(sh(['g++', '-O2', '-std=c++17', '-o', 'main', 'main.cpp'])) || { run: ['./main'] }
    }
    case 'csharp': {
      writeFileSync(join(dir, 'Main.cs'), code)
      return fail(sh(['mcs', '-out:main.exe', 'Main.cs'])) || { run: ['mono', 'main.exe'] }
    }
    case 'nasm': {
      writeFileSync(join(dir, 'main.asm'), code)
      return fail(sh(['nasm', '-f', 'elf64', 'main.asm', '-o', 'main.o'])) || fail(sh(['ld', 'main.o', '-o', 'main'])) || { run: ['./main'] }
    }
  }
}

/** null when every test passes; otherwise what went wrong (in Danish). */
export function checkReference(lang: JudgeLanguage, code: string, tests: ProblemTest[], timeLimitS: number): string | null {
  const dir = mkdtempSync(join(tmpdir(), 'judge-'))
  try {
    const p = prepare(lang, code, dir)
    if ('error' in p) return `Referenceløsningen ${p.error}`
    for (const [i, t] of tests.entries()) {
      const r = spawnSync(p.run[0], p.run.slice(1), { cwd: dir, input: t.input, encoding: 'utf8', timeout: Math.max(2000, timeLimitS * 3000) })
      if (r.error && (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') return `Referenceløsningen bliver ikke færdig i tide på test ${i + 1}.`
      if (r.status !== 0) return `Referenceløsningen fejler på test ${i + 1}: ${(r.stderr || '').slice(0, 300)}`
      if (!sameOutput(r.stdout, t.output)) return `Referenceløsningen giver et andet svar på test ${i + 1}: forventede ${JSON.stringify(t.output)}, fik ${JSON.stringify(r.stdout)}.`
    }
    return null
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
