// Small client-side search: every query term must match (prefix match on
// words, accent-insensitive); title matches rank higher.

import type { SearchDoc } from '@/types/content'

export interface SearchHit {
  doc: SearchDoc
  score: number
  snippet: string
}

export const fold = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function search(docs: SearchDoc[], query: string, type?: string, limit = 100): SearchHit[] {
  const terms = fold(query).split(/\s+/).filter((t) => t.length >= 2)
  if (!terms.length) return []
  const hits: SearchHit[] = []
  for (const doc of docs) {
    if (type && doc.type !== type) continue
    const title = fold(doc.title)
    const text = fold(doc.text)
    let score = 0
    let ok = true
    for (const t of terms) {
      const inTitle = title.includes(t)
      const idx = text.indexOf(t)
      if (!inTitle && idx < 0) {
        ok = false
        break
      }
      score += inTitle ? 5 : 1
      if (idx >= 0 && (idx === 0 || /\W/.test(text[idx - 1]))) score += 1 // word start
    }
    if (!ok) continue
    if (doc.type === 'glossary') score += 2
    hits.push({ doc, score, snippet: snippet(doc.text, terms) })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

function snippet(text: string, terms: string[]) {
  const f = fold(text)
  const i = Math.max(0, f.indexOf(terms[0]))
  const start = Math.max(0, i - 60)
  let s = esc(text.slice(start, start + 200))
  for (const t of terms) {
    const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    s = s.replace(re, '<mark>$1</mark>')
  }
  return (start > 0 ? '…' : '') + s + (start + 200 < text.length ? '…' : '')
}
