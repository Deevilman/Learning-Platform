// Flag checking, shared by the Edge Function "flag" and the tests. Flags are
// stored only as salted SHA-256 hashes ("sha256:<salt>:<hex>"). Lab flags are
// unique per learner: HMAC(secret, user:challenge). Uses Web Crypto only.

const enc = new TextEncoder()
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function sha256Hex(s: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(s)))
}

/** "sha256:<salt>:<hex of sha256(salt:flag)>". Only this goes into a course file. */
export async function hashFlag(flag: string, salt: string): Promise<string> {
  return `sha256:${salt}:${await sha256Hex(`${salt}:${flag.trim()}`)}`
}

export const isFlagHash = (s: unknown): s is string => typeof s === 'string' && /^sha256:[0-9a-f]{16,64}:[0-9a-f]{64}$/.test(s)

/** Constant-time comparison of two equal-length hex strings. */
function sameHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

export async function checkFlag(submitted: string, stored: string): Promise<boolean> {
  if (!isFlagHash(stored)) return false
  const [, salt, want] = stored.split(':')
  return sameHex(await sha256Hex(`${salt}:${submitted.trim()}`), want)
}

/** A learner's own flag for a local lab: FLAG{24 hex chars}. */
export async function labFlag(secret: string, userId: string, challengeId: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return `FLAG{${hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${userId}:${challengeId}`))).slice(0, 24)}}`
}

export function flagRateLimited(timestamps: number[], now: number, perMinute = 5, perDay = 60): string | null {
  if (timestamps.filter((t) => t > now - 60_000).length >= perMinute) return 'Mange gæt på kort tid. Vent et minut.'
  if (timestamps.filter((t) => t > now - 86_400_000).length >= perDay) return 'Du har gættet mange gange i dag. Prøv igen i morgen.'
  return null
}
