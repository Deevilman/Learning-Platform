// One number format for the whole app: US style (1,234.5). Inside math ($…$)
// numbers get no thousands separator, so KaTeX needs no {,} tricks.

const cache = new Map<string, Intl.NumberFormat>()
function nf(min: number, max: number, grouping: boolean) {
  const k = `${min}/${max}/${grouping}`
  let f = cache.get(k)
  if (!f) cache.set(k, (f = new Intl.NumberFormat('en-US', { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: grouping })))
  return f
}

export interface NumberFormatOptions {
  /** Most decimals to show (default 2). Trailing zeros are dropped unless `fixed`. */
  decimals?: number
  /** Always show exactly `decimals` decimals (aligned options, money). */
  fixed?: boolean
  /** For use inside $…$: no thousands separator. */
  math?: boolean
}

export function formatNumber(x: number, { decimals = 2, fixed = false, math = false }: NumberFormatOptions = {}): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—'
  const d = Math.max(0, Math.min(20, decimals))
  // round like toFixed, so text and answers computed with toFixed agree
  const s = nf(fixed ? d : 0, d, !math).format(Number(x.toFixed(d)))
  // "-0" and "-0.00" after rounding are just zero
  return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s
}

/**
 * Read a number the learner typed. US format: "1,234.5", "1234.5", "0.25".
 * A comma that can't be a thousands separator ("1,5", "1.234,5") is probably a
 * Danish decimal comma: then `ask` holds what we think was meant.
 */
export function readNumber(input: string): { value: number } | { ask: string } | null {
  const s = input.trim().replace(/−/g, '-').replace(/\s+/g, '')
  if (!s) return null
  const grouped = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/
  if (grouped.test(s)) return { value: Number(s.replace(/,/g, '')) }
  if (/^-?\d+(\.\d+)?$|^-?\.\d+$/.test(s)) return { value: Number(s) }
  // Danish: "1,5" or "1.234,5"
  if (/^-?\d{1,3}(\.\d{3})*,\d+$|^-?\d+,\d+$/.test(s)) return { ask: s.replace(/\./g, '').replace(',', '.') }
  return null
}
