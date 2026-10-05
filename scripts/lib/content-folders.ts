// Coding problems and challenges as folders, next to the ```problem and
// ```challenge blocks in the course file. Nicer for code: the reference
// solution is a real .py/.c file and each test is an .in/.out pair.
//
//   content/problems/<course>/<name>/          id: <course>/<name>
//     meta.yaml        titel, svaerhed, emner, sprog, tid, hukommelse, uge, hints
//     opgave.md        the statement
//     loesning.md      the walkthrough ("Gennemgang af løsningen")
//     reference.py     the reference solution (.py .c .cpp .cs .asm), must pass every test
//     start.py         optional starter code, one file per language
//     tests/offentlig/<n>.in + <n>.out   shown as examples
//     tests/skjult/<n>.in + <n>.out      only for the judge
//
//   content/challenges/<course>/<name>/        id: <course>/<name>
//     meta.yaml        titel, miljoe, svaerhed, emner, hints, flag_hash/flag_pr_elev, lab, ekstern
//     opgave.md        the text
//     writeup.md       the write-up (only shown after the flag is accepted)
//     sandbox.html     browser-sandbox: the page that runs without network
//     filer/*          files: harmless, reviewed text files to download
//
// The result has the same shape as a block, so the same validation applies.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import YAML from 'yaml'
import type { JudgeLanguage } from '../../src/types/content.ts'

export interface FolderItem {
  course: string
  file: string // the folder, for error messages
  data: Record<string, unknown>
  errors: string[]
}

const EXT: Record<string, JudgeLanguage> = { py: 'python', c: 'c', cpp: 'cpp', cs: 'csharp', asm: 'nasm' }
const NAME_RE = /^[a-z0-9][a-z0-9_-]*$/

const dirs = (p: string) => (existsSync(p) ? readdirSync(p).filter((n) => !n.startsWith('.') && statSync(join(p, n)).isDirectory()).sort() : [])
const files = (p: string) => (existsSync(p) ? readdirSync(p).filter((n) => !n.startsWith('.') && statSync(join(p, n)).isFile()).sort(byNumber) : [])
const text = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : undefined)
/** "2.in" before "10.in". */
function byNumber(a: string, b: string) {
  return a.localeCompare(b, 'en', { numeric: true })
}

function readMeta(dir: string, errors: string[]): Record<string, unknown> {
  const raw = text(join(dir, 'meta.yaml'))
  if (raw === undefined) {
    errors.push('meta.yaml mangler.')
    return {}
  }
  try {
    const m = YAML.parse(raw)
    if (m && typeof m === 'object' && !Array.isArray(m)) return m
    errors.push('meta.yaml skal være en YAML-ordbog (felt: værdi).')
  } catch (e) {
    errors.push(`meta.yaml kunne ikke læses: ${String((e as Error).message).split('\n')[0]}`)
  }
  return {}
}

function readTests(dir: string, errors: string[], label: string) {
  const out: { input: string; output: string }[] = []
  for (const f of files(dir).filter((n) => n.endsWith('.out'))) {
    const input = text(join(dir, f.replace(/\.out$/, '.in')))
    out.push({ input: input ?? '', output: text(join(dir, f))! })
  }
  for (const f of files(dir).filter((n) => n.endsWith('.in'))) if (!existsSync(join(dir, f.replace(/\.in$/, '.out')))) errors.push(`${label}/${f} mangler sin .out-fil.`)
  return out
}

export function readProblemFolders(root: string): FolderItem[] {
  const base = join(root, 'content', 'problems')
  const items: FolderItem[] = []
  for (const course of dirs(base))
    for (const name of dirs(join(base, course))) {
      const dir = join(base, course, name)
      const errors: string[] = []
      if (!NAME_RE.test(name)) errors.push('Mappenavnet må kun indeholde små bogstaver, tal, "-" og "_".')
      const meta = readMeta(dir, errors)
      for (const k of ['id', 'opgave', 'loesning', 'reference', 'offentlige_tests', 'skjulte_tests', 'startkode']) if (k in meta) errors.push(`"${k}" hører ikke til i meta.yaml; det kommer fra mappens filer.`)
      const refs = files(dir).filter((f) => /^reference\.\w+$/.test(f))
      if (refs.length !== 1) errors.push(`Der skal være præcis én referenceløsning (reference.py, .c, .cpp, .cs eller .asm); fandt ${refs.length}.`)
      const refLang = refs[0] ? EXT[refs[0].split('.').pop()!] : undefined
      if (refs[0] && !refLang) errors.push(`"${refs[0]}": ukendt filtype.`)
      const startkode: Record<string, string> = {}
      for (const f of files(dir).filter((n) => /^start\.\w+$/.test(n))) {
        const lang = EXT[f.split('.').pop()!]
        if (lang) startkode[lang] = text(join(dir, f))!
        else errors.push(`"${f}": ukendt filtype.`)
      }
      items.push({
        course,
        file: relative(root, dir),
        errors,
        data: {
          ...meta,
          id: `${course}/${name}`,
          opgave: text(join(dir, 'opgave.md')),
          loesning: text(join(dir, 'loesning.md')),
          offentlige_tests: readTests(join(dir, 'tests', 'offentlig'), errors, 'tests/offentlig'),
          skjulte_tests: readTests(join(dir, 'tests', 'skjult'), errors, 'tests/skjult'),
          ...(refs[0] && refLang ? { reference: { sprog: refLang, kode: text(join(dir, refs[0])) } } : {}),
          ...(Object.keys(startkode).length ? { startkode } : {}),
        },
      })
    }
  return items
}

export function readChallengeFolders(root: string): FolderItem[] {
  const base = join(root, 'content', 'challenges')
  const items: FolderItem[] = []
  for (const course of dirs(base))
    for (const name of dirs(join(base, course))) {
      const dir = join(base, course, name)
      const errors: string[] = []
      if (!NAME_RE.test(name)) errors.push('Mappenavnet må kun indeholde små bogstaver, tal, "-" og "_".')
      const meta = readMeta(dir, errors)
      for (const k of ['id', 'opgave', 'writeup', 'sandbox', 'filer']) if (k in meta) errors.push(`"${k}" hører ikke til i meta.yaml; det kommer fra mappens filer.`)
      const filer = files(join(dir, 'filer')).map((f) => ({ navn: f, indhold: text(join(dir, 'filer', f)) }))
      const sandbox = text(join(dir, 'sandbox.html'))
      items.push({
        course,
        file: relative(root, dir),
        errors,
        data: {
          ...meta,
          id: `${course}/${name}`,
          opgave: text(join(dir, 'opgave.md')),
          writeup: text(join(dir, 'writeup.md')),
          ...(filer.length ? { filer } : {}),
          ...(sandbox !== undefined ? { sandbox } : {}),
        },
      })
    }
  return items
}
