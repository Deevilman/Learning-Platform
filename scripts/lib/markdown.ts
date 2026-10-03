// Markdown → HTML with GFM, raw HTML (<details>), KaTeX (incl. mhchem),
// Mermaid placeholders and ::interactive{…} directives.

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import katex from 'katex'
import 'katex/contrib/mhchem'

void katex // mhchem registers itself on the shared katex instance

export interface RenderContext {
  file: string
  line: number
  interactives: Set<string>
  /** Title and "Prøv selv" intro per interactive component (from its meta). */
  interactiveMeta?: Map<string, { title: string; intro?: string }>
  errors: { file: string; line: number; message: string }[]
  directives: { id: string; file: string; line: number }[]
}

const DIRECTIVE_RE = /^::interactive\{([^}]*)\}\s*$/

/** Parse `id="bayes" prior="0.01"` into an object. */
export function parseAttrs(s: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of s.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+))/g)) out[m[1]] = m[2] ?? m[3] ?? m[4] ?? ''
  return out
}

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * remark-math wants display math fences on their own lines ("$$\n…\n$$");
 * text after an opening "$$" is treated as meta and dropped. The plans often
 * write "$$\begin{aligned}" … "\end{aligned}$$" or "$$x = 1$$" on one line, as
 * Obsidian/GitHub allow. Normalise those to separate fence lines.
 */
export function normaliseDisplayMath(md: string): string {
  let inFence = false
  let inMath = false
  const out: string[] = []
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (inFence) {
      out.push(line)
      continue
    }
    const indent = /^\s*(?:>\s*)*/.exec(line)![0]
    const t = line.slice(indent.length).trim()
    if (!inMath && t.startsWith('$$')) {
      const rest = t.slice(2)
      const close = rest.indexOf('$$')
      if (close >= 0) {
        let after = rest.slice(close + 2).trim()
        // "$$…$$, så …": the punctuation belongs inside the formula
        const p = /^[.,;:]/.exec(after)?.[0] || ''
        after = after.slice(p.length).trim()
        out.push(indent + '$$', indent + rest.slice(0, close) + p, indent + '$$')
        if (after) out.push(indent + after)
      } else {
        out.push(indent + '$$')
        if (rest.trim()) out.push(indent + rest)
        inMath = true
      }
      continue
    }
    if (inMath) {
      const close = t.indexOf('$$')
      if (close >= 0) {
        const before = t.slice(0, close)
        let after = t.slice(close + 2).trim()
        const p = /^[.,;:]/.exec(after)?.[0] || ''
        after = after.slice(p.length).trim()
        if (before.trim()) out.push(indent + before + p)
        else if (p) out[out.length - 1] += p
        out.push(indent + '$$')
        if (after) out.push(indent + after)
        inMath = false
      } else out.push(line)
      continue
    }
    out.push(line)
  }
  return out.join('\n')
}

function preprocess(md: string, ctx: RenderContext): string {
  let inFence = false
  return normaliseDisplayMath(md)
    .split('\n')
    .map((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
      if (inFence) return line
      const m = DIRECTIVE_RE.exec(line.trim())
      if (!m) return line
      const attrs = parseAttrs(m[1])
      const id = attrs.id
      delete attrs.id
      if (!id) {
        ctx.errors.push({ file: ctx.file, line: ctx.line + i, message: '::interactive mangler id="…"' })
        return ''
      }
      if (!ctx.interactives.has(id)) ctx.errors.push({ file: ctx.file, line: ctx.line + i, message: `Ukendt interaktiv komponent "${id}" (findes ikke i content/interactives/)` })
      ctx.directives.push({ id, file: ctx.file, line: ctx.line + i })
      // a short "Prøv selv: …" line introduces every component (attribute intro="…" overrides the component's own)
      const intro = attrs.intro || ctx.interactiveMeta?.get(id)?.intro
      delete attrs.intro
      const lead = intro ? `\n**Prøv selv:** ${intro}\n` : ''
      return `${lead}\n<div class="interactive" data-interactive="${escapeAttr(id)}" data-props="${escapeAttr(JSON.stringify(attrs))}"></div>\n`
    })
    .join('\n')
}

function rehypeCodeBlocks() {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index, parent: any) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return
      const code = node.children?.find((c: any) => c.tagName === 'code')
      if (!code) return
      const cls: string[] = code.properties?.className || []
      const lang = (cls.find((c) => String(c).startsWith('language-')) || '').toString().slice(9)
      if (lang === 'mermaid') {
        const text = code.children.map((c: any) => c.value || '').join('')
        parent.children[index] = { type: 'element', tagName: 'div', properties: { className: ['mermaid-src'], dataMermaid: text }, children: [] }
        return
      }
      node.properties = { ...(node.properties || {}), dataLang: lang || 'text', className: ['code-block'] }
    })
  }
}

function rehypeLinks() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName === 'a' && /^https?:/.test(String(node.properties?.href || ''))) {
        node.properties.target = '_blank'
        node.properties.rel = 'noopener noreferrer'
      }
      if (node.tagName === 'table') {
        node.properties = { ...(node.properties || {}), className: ['md-table'] }
      }
    })
  }
}

function makeProcessor(ctx: RenderContext) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex, {
      output: 'html',
      throwOnError: false,
      strict: 'ignore',
      errorColor: '#dc2626',
    } as any)
    .use(rehypeCodeBlocks)
    .use(rehypeLinks)
    .use(rehypeStringify)
    .use(function collectKatexErrors() {
      return (tree: any) => {
        visit(tree, 'element', (node: any) => {
          const cls: string[] = node.properties?.className || []
          if (cls.includes('katex-error')) ctx.errors.push({ file: ctx.file, line: ctx.line, message: `KaTeX-fejl: ${node.properties?.title || ''}` })
        })
      }
    })
}

export function renderMarkdown(md: string, ctx: RenderContext): string {
  if (!md || !md.trim()) return ''
  const pre = preprocess(md, ctx)
  const html = String(makeProcessor(ctx).processSync(pre)).trim()
  // A list that starts with "**(a)**" holds sub-questions: style it as such.
  return html.replace(/<ul>(\s*<li>\s*(?:<p>)?<strong>\(a\)<\/strong>)/g, '<ul class="subq">$1')
}

/** Render a single line/paragraph without the wrapping <p>. */
export function renderInline(md: string, ctx: RenderContext): string {
  const html = renderMarkdown(md, ctx)
  const m = /^<p>([\s\S]*)<\/p>$/.exec(html)
  return m && !m[1].includes('<p>') ? m[1] : html
}

/** Plain text for search and list titles. */
export function plainText(md: string, max = 0): string {
  let s = md
    .replace(/<[^>]+>/g, ' ')
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$]*)\$/g, '$1')
    .replace(/\\(?:mathbb|mathrm|text|mathcal|operatorname)\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/[*_`#>|]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  if (max && s.length > max) s = s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
  return s
}
