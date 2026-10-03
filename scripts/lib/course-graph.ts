// The course graph: written courses plus planned ones (content/course-graph.yaml).
// Edges: a course in "requires" or "recommended_before" comes before the
// course; a course in "next" comes after it. Unknown slugs and cycles are
// errors. Used by the content build and when a course is uploaded.

export interface GraphNode {
  slug: string
  title: string
  track?: string
  requires: string[]
  recommendedBefore: string[]
  next: string[]
  exam?: string
  planned?: boolean
}

export interface GraphIssue {
  slug: string
  message: string
}

/** Planned courses from content/course-graph.yaml (parsed YAML), with shape errors. */
export function plannedFrom(raw: unknown): { planned: GraphNode[]; errors: GraphIssue[] } {
  const errors: GraphIssue[] = []
  const list = (raw as { planned?: unknown })?.planned
  if (list === undefined) return { planned: [], errors }
  if (!Array.isArray(list)) return { planned: [], errors: [{ slug: '', message: '"planned" skal være en liste af kurser.' }] }
  const strs = (x: unknown) => (Array.isArray(x) ? x.map(String) : [])
  const planned = list.flatMap((p: any, i: number): GraphNode[] => {
    if (!p?.slug || !p?.title) {
      errors.push({ slug: String(p?.slug || `#${i + 1}`), message: 'et planlagt kursus skal have "slug" og "title".' })
      return []
    }
    return [{ slug: String(p.slug), title: String(p.title), track: p.track ? String(p.track) : undefined, requires: strs(p.requires), recommendedBefore: strs(p.recommended_before), next: strs(p.next), exam: p.exam ? String(p.exam) : undefined, planned: true }]
  })
  return { planned, errors }
}

export function validateGraph(nodes: GraphNode[]): GraphIssue[] {
  const issues: GraphIssue[] = []
  const bySlug = new Map<string, GraphNode>()
  for (const n of nodes) {
    const other = bySlug.get(n.slug)
    if (other) issues.push({ slug: n.slug, message: other.planned || n.planned ? `"${n.slug}" er både skrevet og planlagt — slet det fra content/course-graph.yaml.` : `kurset "${n.slug}" findes to gange.` })
    else bySlug.set(n.slug, n)
  }
  const fields: [keyof GraphNode, string][] = [
    ['requires', 'requires'],
    ['recommendedBefore', 'recommended_before'],
    ['next', 'next'],
  ]
  for (const n of bySlug.values())
    for (const [f, name] of fields)
      for (const ref of n[f] as string[]) {
        if (ref === n.slug) issues.push({ slug: n.slug, message: `"${name}" peger på kurset selv.` })
        else if (!bySlug.has(ref)) issues.push({ slug: n.slug, message: `"${name}: ${ref}" er ikke et kursus (heller ikke et planlagt i content/course-graph.yaml).` })
      }
  // edges "before → after"
  const after = new Map<string, string[]>()
  const edge = (a: string, b: string) => bySlug.has(a) && bySlug.has(b) && a !== b && after.set(a, [...(after.get(a) || []), b])
  for (const n of bySlug.values()) {
    for (const p of [...n.requires, ...n.recommendedBefore]) edge(p, n.slug)
    for (const x of n.next) edge(n.slug, x)
  }
  const state = new Map<string, 1 | 2>() // 1 = on the path, 2 = done
  const path: string[] = []
  const reported = new Set<string>()
  const visit = (s: string) => {
    state.set(s, 1)
    path.push(s)
    for (const t of after.get(s) || []) {
      if (state.get(t) === 1) {
        const cycle = [...path.slice(path.indexOf(t)), t]
        const key = [...cycle].sort().join(',')
        if (!reported.has(key)) {
          reported.add(key)
          issues.push({ slug: t, message: `rækkefølgen går i ring: ${cycle.join(' → ')}.` })
        }
      } else if (!state.has(t)) visit(t)
    }
    path.pop()
    state.set(s, 2)
  }
  for (const s of [...bySlug.keys()].sort()) if (!state.has(s)) visit(s)
  return issues
}
