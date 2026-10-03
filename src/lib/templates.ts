// Exercise templates ("opgaveskabeloner"): an exercise generator written as
// YAML instead of TypeScript, so a course file can bring its own. Random
// variables → computed values (expr.ts, sandboxed) → text with {name}
// placeholders → an auto-check. The same seed always gives the same exercise,
// and a template becomes an ordinary Generator, so the rest of the app
// (training, mastery, multiple choice) treats it like the built-in ones.

import type { AutoCheck, Difficulty } from '../types/content'
import type { GeneratedExercise, Generator } from './generators'
import { evaluate, numericClose } from './check'
import { evalExpr, ExprError, parseExpr, type Expr } from './expr'
import { makeRng, type Rng } from './rng'

export const TEMPLATE_TYPES = ['tal', 'multiple-choice', 'tekst', 'udtryk', 'kode'] as const
export type TemplateType = (typeof TEMPLATE_TYPES)[number]

export type VariableDef =
  | { interval: [number, number]; decimaler?: number; trin?: number; ikke?: number[] }
  | { vaelg: (number | string)[]; vaelg_par_med?: string }
  | { primtal: [number, number] }
  | { fortegn: true }

export interface TemplateDef {
  id: string
  titel?: string
  kursus?: string
  emner: string[]
  svaerhed?: number | number[]
  /** Different content per difficulty: each level overrides the fields above. */
  niveauer?: Record<string, Partial<Omit<TemplateDef, 'id' | 'niveauer'>>>
  type: TemplateType
  variabler?: Record<string, VariableDef>
  beregn?: Record<string, string | number>
  betingelser?: string[]
  opgave: string
  opgave_en?: string
  svar: {
    udtryk?: string | number
    tekst?: string | string[]
    tolerance?: number | string
    enhed?: string
    decimaler?: number
    variabler?: string[]
    maengde?: boolean
  }
  hints: string[]
  hints_en?: string[]
  loesning: string
  loesning_en?: string
  distraktorer?: { udtryk?: string | number; tekst?: string; forklaring?: string }[]
}

const ID_RE = /^[a-z0-9][a-z0-9/_-]*$/
const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
const KNOWN_KEYS = new Set(['id', 'titel', 'kursus', 'emner', 'svaerhed', 'type', 'variabler', 'beregn', 'betingelser', 'opgave', 'opgave_en', 'svar', 'hints', 'hints_en', 'loesning', 'loesning_en', 'distraktorer', 'niveauer'])
const LEVEL_KEYS = new Set(['variabler', 'beregn', 'betingelser', 'opgave', 'opgave_en', 'svar', 'hints', 'hints_en', 'loesning', 'loesning_en', 'distraktorer', 'type'])

/** A number as it appears in exercise text (one place, so the number format can change later). */
export function fmtNum(x: number, decimals?: number): string {
  if (decimals !== undefined) return roundTo(x, decimals).toFixed(decimals)
  const r = +x.toPrecision(12)
  return Object.is(r, -0) ? '0' : String(r)
}
const roundTo = (x: number, d: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 10 ** d) / 10 ** d

// ---------- structure check (before anything is sampled)

/** Problems with the template's shape, in Danish. Empty when it looks right. */
export function checkTemplateShape(def: unknown): string[] {
  if (!def || typeof def !== 'object' || Array.isArray(def)) return ['Skabelonen skal være en YAML-ordbog (felt: værdi).']
  const d = def as TemplateDef
  const unknown = Object.keys(d).filter((k) => !KNOWN_KEYS.has(k)).map((k) => `Ukendt felt "${k}".`)
  if (d.niveauer === undefined) return [...unknown, ...shapeOf(d)]
  if (!d.niveauer || typeof d.niveauer !== 'object' || !Object.keys(d.niveauer).length || Object.keys(d.niveauer).some((k) => !['1', '2', '3'].includes(k)))
    return [...unknown, '"niveauer" skal have nøglerne 1, 2 og/eller 3.']
  const out = [...unknown]
  for (const [lvl, o] of Object.entries(d.niveauer)) {
    for (const k of Object.keys(o || {})) if (!LEVEL_KEYS.has(k)) out.push(`Niveau ${lvl}: feltet "${k}" kan ikke stå under et niveau.`)
    out.push(...shapeOf(levelDef(d, Number(lvl) as Difficulty)).map((m) => `Niveau ${lvl}: ${m}`))
  }
  return [...new Set(out)]
}

/** The template as it looks at one difficulty (fields under niveauer.<d> win). */
export function levelDef(def: TemplateDef, d: Difficulty): TemplateDef {
  if (!def.niveauer) return def
  let m = levelCache.get(def)
  if (!m) levelCache.set(def, (m = new Map()))
  let l = m.get(d)
  if (!l) m.set(d, (l = { ...def, ...(def.niveauer[d] || {}), svaerhed: d, niveauer: undefined }))
  return l
}
const levelCache = new WeakMap<TemplateDef, Map<Difficulty, TemplateDef>>()

function shapeOf(d: TemplateDef): string[] {
  const e: string[] = []
  if (typeof d.id !== 'string' || !ID_RE.test(d.id)) e.push('Feltet "id" mangler eller indeholder andet end små bogstaver, tal, "-", "_" og "/".')
  if (!Array.isArray(d.emner) || !d.emner.length || d.emner.some((x) => typeof x !== 'string')) e.push('Feltet "emner" skal være en liste med mindst ét emne.')
  const sv = Array.isArray(d.svaerhed) ? d.svaerhed : [d.svaerhed]
  if (!sv.length || sv.some((x) => x !== 1 && x !== 2 && x !== 3)) e.push('Feltet "svaerhed" skal være 1, 2, 3 eller en liste af dem.')
  if (!TEMPLATE_TYPES.includes(d.type as TemplateType)) e.push(`Feltet "type" skal være en af: ${TEMPLATE_TYPES.join(', ')}.`)
  if (d.type === 'kode') e.push('Typen "kode" bruges til kodeopgaver i en "problem"-blok, ikke i en opgaveskabelon.')
  if (typeof d.opgave !== 'string' || !d.opgave.trim()) e.push('Feltet "opgave" mangler.')
  if (typeof d.loesning !== 'string' || !d.loesning.trim()) e.push('Feltet "loesning" mangler. Hver opgave skal have en løsning.')
  if (!Array.isArray(d.hints) || !d.hints.length || d.hints.some((x) => typeof x !== 'string')) e.push('Feltet "hints" skal være en liste med mindst ét hint.')
  const svar = d.svar as TemplateDef['svar'] | undefined
  if (!svar || typeof svar !== 'object') e.push('Feltet "svar" mangler.')
  else {
    if (d.type === 'tal' && svar.udtryk === undefined) e.push('En opgave af typen "tal" skal have "svar: { udtryk: … }".')
    if (d.type === 'udtryk' && (typeof svar.udtryk !== 'string' || !Array.isArray(svar.variabler) || !svar.variabler.length)) e.push('En opgave af typen "udtryk" skal have "svar: { udtryk: …, variabler: [x] }".')
    if (d.type === 'tekst' && svar.tekst === undefined) e.push('En opgave af typen "tekst" skal have "svar: { tekst: … }".')
    if (d.type === 'multiple-choice' && svar.udtryk === undefined && svar.tekst === undefined) e.push('En multiple choice-opgave skal have "svar: { udtryk: … }" eller "svar: { tekst: … }".')
    if (svar.tolerance !== undefined && parseTolerance(svar.tolerance) === null) e.push('"tolerance" skal være et tal (fx 0.01) eller en procent (fx "0.5%").')
  }
  if (d.type === 'multiple-choice' && (!Array.isArray(d.distraktorer) || d.distraktorer.length < 3)) e.push('En multiple choice-opgave skal have mindst 3 "distraktorer" (forkerte svar).')
  if (d.distraktorer !== undefined && !Array.isArray(d.distraktorer)) e.push('"distraktorer" skal være en liste.')
  const names = new Set<string>()
  if (d.variabler !== undefined) {
    if (typeof d.variabler !== 'object' || Array.isArray(d.variabler)) e.push('"variabler" skal være en ordbog (navn: definition).')
    else
      for (const [n, v] of Object.entries(d.variabler as Record<string, unknown>)) {
        if (!NAME_RE.test(n)) e.push(`Variabelnavnet "${n}" må kun indeholde bogstaver, tal og "_".`)
        const msg = variableShape(n, v, names)
        if (msg) e.push(msg)
        names.add(n)
      }
  }
  if (d.beregn !== undefined) {
    if (typeof d.beregn !== 'object' || Array.isArray(d.beregn)) e.push('"beregn" skal være en ordbog (navn: udtryk).')
    else
      for (const [n, x] of Object.entries(d.beregn as Record<string, unknown>)) {
        if (!NAME_RE.test(n)) e.push(`Navnet "${n}" i "beregn" må kun indeholde bogstaver, tal og "_".`)
        if (names.has(n)) e.push(`"${n}" er defineret to gange.`)
        names.add(n)
        e.push(...syntax(x, `beregn.${n}`))
      }
  }
  if (d.betingelser !== undefined && !Array.isArray(d.betingelser)) e.push('"betingelser" skal være en liste af udtryk.')
  else for (const [i, b] of ((d.betingelser as unknown[]) || []).entries()) e.push(...syntax(b, `betingelser[${i + 1}]`))
  if (svar && typeof svar === 'object' && d.type !== 'udtryk' && svar.udtryk !== undefined) e.push(...syntax(svar.udtryk, 'svar.udtryk'))
  for (const [i, x] of (Array.isArray(d.distraktorer) ? d.distraktorer : []).entries()) {
    if (!x || typeof x !== 'object' || (x.udtryk === undefined && x.tekst === undefined)) e.push(`Distraktor ${i + 1} skal have "udtryk" eller "tekst".`)
    else if (x.udtryk !== undefined) e.push(...syntax(x.udtryk, `distraktorer[${i + 1}].udtryk`))
  }
  return e
}

function variableShape(n: string, v: unknown, earlier: Set<string>): string | null {
  if (!v || typeof v !== 'object') return `Variablen "${n}" skal have en definition, fx { interval: [1, 10] }.`
  const o = v as Record<string, unknown>
  const pair = (x: unknown) => Array.isArray(x) && x.length === 2 && x.every((y) => typeof y === 'number') && x[0] <= x[1]
  if ('interval' in o) return pair(o.interval) ? null : `"${n}": interval skal være [mindst, højst].`
  if ('primtal' in o) return pair(o.primtal) && primesIn(o.primtal as [number, number]).length ? null : `"${n}": primtal skal være [mindst, højst] med mindst ét primtal imellem.`
  if ('fortegn' in o) return null
  if ('vaelg' in o) {
    if (!Array.isArray(o.vaelg) || !o.vaelg.length) return `"${n}": vaelg skal være en liste.`
    if (o.vaelg_par_med !== undefined && !earlier.has(String(o.vaelg_par_med))) return `"${n}": vaelg_par_med skal pege på en variabel længere oppe.`
    return null
  }
  return `Variablen "${n}" skal bruge interval, vaelg, primtal eller fortegn.`
}

function syntax(x: unknown, where: string): string[] {
  if (typeof x === 'number') return []
  if (typeof x !== 'string') return [`${where} skal være et udtryk.`]
  try {
    parseExpr(x)
    return []
  } catch (err) {
    return [`${where}: ${(err as Error).message}.`]
  }
}

function parseTolerance(t: number | string): { tol: number; relative: boolean } | null {
  if (typeof t === 'number') return t >= 0 ? { tol: t, relative: false } : null
  const m = /^\s*(\d+(?:\.\d+)?)\s*%\s*$/.exec(t)
  if (m) return { tol: Number(m[1]) / 100, relative: true }
  const n = Number(t)
  return isFinite(n) && n >= 0 ? { tol: n, relative: false } : null
}

function primesIn([a, b]: [number, number]): number[] {
  const out: number[] = []
  for (let n = Math.max(2, Math.ceil(a)); n <= b && out.length < 10000; n++) {
    let p = true
    for (let k = 2; k * k <= n; k++) if (n % k === 0) (p = false)
    if (p) out.push(n)
  }
  return out
}

// ---------- sampling

type Values = { nums: Record<string, number>; strs: Record<string, string> }

class TemplateError extends Error {}

function sample(def: TemplateDef, rng: Rng, compiled: Compiled): Values {
  for (let attempt = 0; attempt < 200; attempt++) {
    const nums: Record<string, number> = {}
    const strs: Record<string, string> = {}
    const picked: Record<string, number> = {}
    for (const [n, v] of Object.entries(def.variabler || {})) {
      let x: number | string
      if ('interval' in v) {
        const [lo, hi] = v.interval
        const ints = v.decimaler === undefined && v.trin === undefined && Number.isInteger(lo) && Number.isInteger(hi)
        const draw = () => (ints ? rng.int(lo, hi) : v.trin ? roundTo(lo + v.trin * rng.int(0, Math.floor((hi - lo) / v.trin + 1e-9)), 10) : rng.real(lo, hi, v.decimaler ?? 2))
        x = draw()
        for (let k = 0; k < 50 && v.ikke?.some((y) => Math.abs(y - (x as number)) < 1e-12); k++) x = draw()
      } else if ('primtal' in v) x = rng.pick(primesIn(v.primtal))
      else if ('fortegn' in v) x = rng.chance(0.5) ? 1 : -1
      else {
        // vaelg_par_med: take the same position as the partner list (e.g. a substance and its molar mass)
        const i = v.vaelg_par_med !== undefined && picked[v.vaelg_par_med] !== undefined ? picked[v.vaelg_par_med] % v.vaelg.length : rng.int(0, v.vaelg.length - 1)
        picked[n] = i
        x = v.vaelg[i]
      }
      if (typeof x === 'number') nums[n] = x
      else strs[n] = x
    }
    for (const [n, e] of compiled.beregn) nums[n] = evalExpr(e, nums)
    if (compiled.betingelser.every((b) => evalExpr(b, nums))) return { nums, strs }
  }
  throw new TemplateError('Betingelserne kunne ikke opfyldes efter 200 forsøg. Gør intervallerne større eller betingelserne mildere.')
}

/**
 * Replace {name} and {name:.2f} with values; unknown names are left alone
 * (LaTeX braces). Right after a TeX command, ^, _ or } the value keeps its
 * braces, so \frac{a}{b} and x^{n} work with any number.
 */
export function interpolate(text: string, v: Values): string {
  return text.replace(/\{([A-Za-z_][A-Za-z0-9_]*)(?::\.(\d)f)?\}/g, (all, n: string, d: string | undefined, at: number) => {
    let out: string
    if (Object.prototype.hasOwnProperty.call(v.nums, n)) out = fmtNum(v.nums[n], d === undefined ? undefined : Number(d))
    else if (Object.prototype.hasOwnProperty.call(v.strs, n)) out = v.strs[n]
    else return all
    return /(\\[A-Za-z]+|[}^_])$/.test(text.slice(0, at)) ? `{${out}}` : out
  })
}

interface Compiled {
  beregn: [string, Expr][]
  betingelser: Expr[]
  answer?: Expr
  distractors: ({ e: Expr } | { text: string })[]
}

function compile(def: TemplateDef): Compiled {
  const ex = (x: string | number) => parseExpr(String(x))
  return {
    beregn: Object.entries(def.beregn || {}).map(([n, x]) => [n, ex(x)]),
    betingelser: (def.betingelser || []).map(ex),
    answer: def.type !== 'udtryk' && def.svar.udtryk !== undefined ? ex(def.svar.udtryk) : undefined,
    distractors: (def.distraktorer || []).map((d) => (d.udtryk !== undefined ? { e: ex(d.udtryk) } : { text: d.tekst || '' })),
  }
}

// ---------- generating one exercise

export interface TemplateExercise extends GeneratedExercise {
  /** Why each distractor is wrong (multiple choice), for validation and feedback. */
  values: Values
}

const compiledCache = new WeakMap<TemplateDef, Compiled>()
function compiledFor(def: TemplateDef): Compiled {
  let c = compiledCache.get(def)
  if (!c) compiledCache.set(def, (c = compile(def)))
  return c
}

export function generateFromTemplate(template: TemplateDef, seed: number, difficulty: Difficulty, lang: 'da' | 'en' = 'da'): TemplateExercise {
  const def = levelDef(template, difficulty)
  const compiled = compiledFor(def)
  const rng = makeRng(seed ^ (difficulty * 0x9e3779b1))
  const v = sample(def, rng, compiled)
  v.nums.svaerhed = difficulty
  const t = (s: string) => interpolate(s, v)
  const prompt = t((lang === 'en' && def.opgave_en) || def.opgave)
  const hints = ((lang === 'en' && def.hints_en) || def.hints).map(t)
  const solution = t((lang === 'en' && def.loesning_en) || def.loesning)
  const tol = def.svar.tolerance !== undefined ? parseTolerance(def.svar.tolerance) : null
  const round = (x: number) => (def.svar.decimaler !== undefined ? roundTo(x, def.svar.decimaler) : x)
  const answerNum = compiled.answer ? round(evalExpr(compiled.answer, v.nums)) : NaN
  const answerText = () => {
    if (def.svar.tekst !== undefined) return (Array.isArray(def.svar.tekst) ? def.svar.tekst : [def.svar.tekst]).map(t)
    return [fmtNum(answerNum, def.svar.decimaler)]
  }
  const unit = def.svar.enhed ? ` ${def.svar.enhed}` : ''
  const dShow = (x: number | string) => (typeof x === 'number' ? fmtNum(round(x), def.svar.decimaler) + unit : t(x))
  const wrongValues = compiled.distractors.map((d) => ('e' in d ? round(evalExpr(d.e, v.nums)) : t(d.text)))
  let check: AutoCheck
  let distractors: (number | string)[] | undefined
  switch (def.type) {
    case 'tal':
      check = { type: 'numeric', answer: answerNum, ...(tol ? { tolerance: tol.tol, relative: tol.relative } : def.svar.decimaler !== undefined ? { tolerance: 0.5 * 10 ** -def.svar.decimaler } : {}), ...(def.svar.enhed ? { unit: def.svar.enhed } : {}) }
      distractors = wrongValues.length ? wrongValues : undefined
      break
    case 'tekst':
      check = { type: 'text', answers: answerText(), ...(def.svar.maengde ? { set: true } : {}) }
      distractors = wrongValues.length ? wrongValues.map(String) : undefined
      break
    case 'udtryk':
      check = { type: 'expression', expected: t(String(def.svar.udtryk)).replace(/\{/g, '(').replace(/\}/g, ')'), variables: def.svar.variabler || [], ...(tol ? { tolerance: tol.tol } : {}) }
      break
    case 'multiple-choice': {
      const right = compiled.answer ? dShow(answerNum) : answerText()[0]
      const options = [right, ...wrongValues.map(dShow)]
      const explanations = [undefined, ...(def.distraktorer || []).map((d) => (d.forklaring ? t(d.forklaring) : undefined))]
      // shuffle deterministically, keep explanations with their options
      const order = makeRng(seed ^ 0x2545f491).shuffle(options.map((_, i) => i))
      check = { type: 'choice', options: order.map((i) => options[i]), correct: order.indexOf(0), explanations: order.map((i) => explanations[i]) }
      break
    }
    default:
      throw new TemplateError(`Typen "${def.type}" kan ikke bruges i en opgaveskabelon.`)
  }
  return { prompt, hint: hints[0], moreHints: hints.slice(1), solution, check, distractors, values: v }
}

// ---------- validation: 200 seeds per difficulty

export interface TemplateReport {
  id: string
  errors: string[]
}

const BAD = /NaN|undefined|Infinity|\[object|null/

/** The number as it may be written in a solution. */
function renderings(x: number, decimals?: number): string[] {
  const out = new Set([fmtNum(x), String(x)])
  if (decimals !== undefined) out.add(fmtNum(x, decimals))
  for (let k = 0; k <= 6; k++) out.add(x.toFixed(k).replace(/\.?0+$/, '') || '0')
  return [...out].filter((s) => s !== '-0')
}

/**
 * Run a template on `seeds` seeds per difficulty. Fails on errors, NaN,
 * a check that rejects its own answer, a solution that doesn't state the
 * answer, or a distractor equal to the answer. Stops at the first failing seed (the same mistake repeats).
 */
export function validateTemplate(raw: unknown, seeds = 200): TemplateReport {
  const id = (raw as { id?: string })?.id || '(uden id)'
  const shape = checkTemplateShape(raw)
  if (shape.length) return { id, errors: shape }
  const def = raw as TemplateDef
  const errors: string[] = []
  for (const d of difficultiesOf(def)) {
    try {
      compiledFor(levelDef(def, d))
    } catch (e) {
      return { id, errors: [(e as Error).message] }
    }
    for (let i = 1; i <= seeds && !errors.length; i++) {
      const seed = i * 7919
      const at = `Seed ${seed}${difficultiesOf(def).length > 1 ? `, sværhed ${d}` : ''}`
      let ex: TemplateExercise
      try {
        ex = generateFromTemplate(def, seed, d)
      } catch (e) {
        errors.push(`${at}: ${e instanceof ExprError || e instanceof TemplateError ? e.message : `uventet fejl: ${(e as Error).message}`}`)
        break
      }
      const err = exerciseProblem(levelDef(def, d), ex)
      if (err) errors.push(`${at}: ${err}`)
    }
  }
  return { id, errors }
}

function exerciseProblem(def: TemplateDef, ex: TemplateExercise): string | null {
  for (const [k, s] of Object.entries({ opgave: ex.prompt, loesning: ex.solution, hint: ex.hint })) if (BAD.test(s)) return `"${k}" indeholder ${s.match(BAD)![0]}: ${s}`
  for (const [n, x] of Object.entries(ex.values.nums)) if (!isFinite(x)) return `"${n}" bliver ${x}. Tilføj en betingelse, der udelukker det.`
  const c = ex.check
  const own = c.type === 'numeric' ? fmtNum(c.answer) : c.type === 'choice' ? String(c.correct) : c.type === 'text' ? c.answers[0] : c.type === 'expression' ? c.expected : ''
  if (!evaluate(c, own).correct) return `svaret ${own} bliver ikke godkendt af tjekket.`
  if (c.type === 'numeric') {
    if (!renderings(c.answer, def.svar.decimaler).some((r) => ex.solution.includes(r))) return `løsningen nævner ikke svaret ${fmtNum(c.answer)}: ${ex.solution}`
    for (const w of ex.distractors || []) if (typeof w === 'number' && numericClose(w, c.answer, c.tolerance ?? 1e-9, c.relative)) return `en distraktor er lig med svaret (${fmtNum(c.answer)}).`
  }
  if (c.type === 'choice') {
    const right = c.options[c.correct]
    if (new Set(c.options).size !== c.options.length) return `en distraktor er lig med svaret (${right}) eller med en anden distraktor.`
    const plain = right.replace(/ .*$/, '')
    if (!ex.solution.includes(plain) && !(isFinite(Number(plain)) && renderings(Number(plain)).some((r) => ex.solution.includes(r)))) return `løsningen nævner ikke svaret ${right}: ${ex.solution}`
  }
  if (c.type === 'text') {
    if (!ex.solution.includes(c.answers[0])) return `løsningen nævner ikke svaret "${c.answers[0]}".`
    for (const w of ex.distractors || []) if (evaluate(c, String(w)).correct) return `en distraktor er lig med svaret ("${w}").`
  }
  if (c.type === 'expression') {
    try {
      parseExpr(c.expected)
    } catch (e) {
      return `svaret "${c.expected}" er ikke et gyldigt udtryk: ${(e as Error).message}`
    }
  }
  return null
}

const difficultiesOf = (def: TemplateDef): Difficulty[] =>
  def.niveauer ? (Object.keys(def.niveauer).map(Number).sort() as Difficulty[]) : ([...new Set(Array.isArray(def.svaerhed) ? def.svaerhed : [def.svaerhed])].sort() as Difficulty[])

// ---------- as a Generator

export function templateToGenerator(def: TemplateDef, course: string): Generator {
  return {
    id: def.id,
    title: def.titel || def.id,
    course: def.kursus || course,
    topics: def.emner,
    difficulties: difficultiesOf(def),
    generate: (seed, d) => {
      const { values: _v, ...ex } = generateFromTemplate(def, seed, d)
      return ex
    },
  }
}
