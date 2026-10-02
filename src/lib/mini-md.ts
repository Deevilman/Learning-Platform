// Tiny Markdown subset for generated exercises (rendered in the browser):
// paragraphs, **bold**, *italic*, `code`, "- " lists, | tables |, $inline$ and
// $$display$$ math (KaTeX).

import katex from 'katex'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function math(tex: string, display: boolean) {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'html', strict: 'ignore' })
}

function inline(s: string): string {
  const parts: string[] = []
  // Pull out math first so its contents are not touched by the other rules.
  const withSlots = s.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (_, d, i) => {
    parts.push(d !== undefined ? math(d, true) : math(i, false))
    return `\u0000${parts.length - 1}\u0000`
  })
  return esc(withSlots)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => parts[Number(i)])
}

export function miniMarkdown(src: string): string {
  const blocks = src.trim().split(/\n\s*\n/)
  return blocks
    .map((b) => {
      const t = b.trim()
      if (t.startsWith('$$') && t.endsWith('$$') && t.length > 4) return math(t.slice(2, -2), true)
      const lines = t.split('\n')
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`
      if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`
      if (lines.every((l) => l.trim().startsWith('|'))) {
        const rows = lines.filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l)).map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
        const [head, ...body] = rows
        return `<table class="md-table"><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      }
      return `<p>${inline(t).replace(/\n/g, '<br>')}</p>`
    })
    .join('\n')
}
