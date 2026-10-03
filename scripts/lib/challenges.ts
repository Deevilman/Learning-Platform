// CTF-style challenges ("udfordringer") from ```challenge blocks. The app gets
// the text, hints and the environment; the flag hash and the write-up go only
// to the server (Edge Function "flag"), never into the bundle. The platform
// never hosts vulnerable systems: labs run on the learner's own machine, and
// external platforms are only linked.

import type { Challenge, ChallengeEnv } from '../../src/types/content.ts'
import { isFlagHash } from '../../supabase/functions/flag/logic.ts'

export const CHALLENGE_ENVS: ChallengeEnv[] = ['none', 'files', 'browser-sandbox', 'local-lab', 'external']
export const EXTERNAL_PLATFORMS = ['OverTheWire', 'picoCTF', 'TryHackMe', 'Hack The Box', 'Campfire Security']

export interface ServerChallenge {
  id: string
  course: string
  flagHash?: string // static flag
  perUser?: boolean // local-lab: a flag per learner (HMAC)
  writeup: string // Markdown, returned only after the flag is accepted
}

const ID_RE = /^[a-z0-9][a-z0-9/_-]*$/
const KEYS = new Set(['id', 'titel', 'miljoe', 'svaerhed', 'emner', 'opgave', 'hints', 'writeup', 'flag_hash', 'flag_pr_elev', 'filer', 'sandbox', 'lab', 'ekstern'])

export function buildChallenge(raw: any, ctx: { course: string; topics: Set<string>; md: (s: string) => string }): { challenge?: Challenge; server?: ServerChallenge; errors: string[] } {
  const e: string[] = []
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { errors: ['En challenge-blok skal være en YAML-ordbog (felt: værdi).'] }
  for (const k of Object.keys(raw)) if (!KEYS.has(k)) e.push(`Ukendt felt "${k}".`)
  if (k(raw.id) || !ID_RE.test(raw.id)) e.push('Feltet "id" mangler eller indeholder andet end små bogstaver, tal, "-", "_" og "/".')
  if (k(raw.titel)) e.push('Feltet "titel" mangler.')
  const env = raw.miljoe as ChallengeEnv
  if (!CHALLENGE_ENVS.includes(env)) e.push(`Feltet "miljoe" skal være en af: ${CHALLENGE_ENVS.join(', ')}.`)
  if (![1, 2, 3].includes(raw.svaerhed)) e.push('Feltet "svaerhed" skal være 1, 2 eller 3.')
  const topics: string[] = Array.isArray(raw.emner) ? raw.emner.map(String) : []
  for (const t of topics) if (!ctx.topics.has(t)) e.push(`Emnet "${t}" står ikke under "topics" i front matter.`)
  if (k(raw.opgave)) e.push('Feltet "opgave" mangler.')
  const hints: string[] = Array.isArray(raw.hints) ? raw.hints.map(String) : []
  if (!hints.length) e.push('Feltet "hints" skal være en liste med mindst ét hint.')
  if (k(raw.writeup)) e.push('Feltet "writeup" (gennemgangen) mangler.')
  const perUser = raw.flag_pr_elev === true
  if (perUser && env !== 'local-lab') e.push('"flag_pr_elev" kan kun bruges i miljøet local-lab.')
  if (!perUser && env !== 'external' && !isFlagHash(raw.flag_hash)) e.push('Feltet "flag_hash" skal være en saltet hash (sha256:<salt>:<hash>). Lav den med: npm run flag-hash -- "FLAG{…}". Skriv aldrig selve flaget i filen.')
  if (typeof raw.flag_hash === 'string' && /flag\{/i.test(raw.flag_hash)) e.push('"flag_hash" ligner et flag i klar tekst. Skriv kun hashen.')
  let files: Challenge['files']
  if (env === 'files') {
    if (!Array.isArray(raw.filer) || !raw.filer.length) e.push('Miljøet "files" skal have "filer": [{ navn, indhold }].')
    else files = raw.filer.map((f: any) => ({ name: String(f?.navn || ''), content: String(f?.indhold ?? '') }))
    if (files?.some((f) => !/^[\w.-]{1,60}$/.test(f.name))) e.push('Filnavne må kun indeholde bogstaver, tal, ".", "-" og "_".')
  }
  if (env === 'browser-sandbox' && k(raw.sandbox)) e.push('Miljøet "browser-sandbox" skal have "sandbox": en lille HTML-side, der kører uden netværk.')
  let lab: Challenge['lab']
  if (env === 'local-lab') {
    if (!raw.lab || k(raw.lab.start) || k(raw.lab.nulstil)) e.push('Miljøet "local-lab" skal have "lab": { start, nulstil, beskrivelse } (én kommando hver).')
    else lab = { start: String(raw.lab.start), reset: String(raw.lab.nulstil), description: String(raw.lab.beskrivelse || '') }
  }
  let external: Challenge['external']
  if (env === 'external') {
    const x = raw.ekstern
    if (!x || !EXTERNAL_PLATFORMS.includes(x.platform) || !/^https:\/\//.test(String(x.url || ''))) e.push(`Miljøet "external" skal have "ekstern": { platform, url } med en af: ${EXTERNAL_PLATFORMS.join(', ')}.`)
    else external = { platform: x.platform, url: String(x.url), levels: Array.isArray(x.niveauer) ? x.niveauer.map(String) : undefined }
  }
  if (e.length) return { errors: e }
  const challenge: Challenge = {
    id: raw.id,
    course: ctx.course,
    title: raw.titel,
    env,
    difficulty: raw.svaerhed,
    topics,
    statementHtml: ctx.md(raw.opgave),
    hintsHtml: hints.map(ctx.md),
    ...(files ? { files } : {}),
    ...(env === 'browser-sandbox' ? { sandbox: String(raw.sandbox) } : {}),
    ...(lab ? { lab } : {}),
    ...(external ? { external } : {}),
    flagChecked: env !== 'external',
  }
  return { challenge, server: { id: raw.id, course: ctx.course, ...(perUser ? { perUser: true } : { flagHash: raw.flag_hash }), writeup: String(raw.writeup) }, errors: [] }
}

const k = (x: unknown) => typeof x !== 'string' || !x.trim()
