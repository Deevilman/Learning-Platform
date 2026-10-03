import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yaml'
import { plannedFrom, validateGraph, type GraphNode } from '../../scripts/lib/course-graph'

const node = (slug: string, o: Partial<GraphNode> = {}): GraphNode => ({ slug, title: slug, requires: [], recommendedBefore: [], next: [], ...o })

describe('course graph', () => {
  it('accepts the planned graph together with the written courses', () => {
    const { planned, errors } = plannedFrom(YAML.parse(readFileSync(join(import.meta.dirname, '../../content/course-graph.yaml'), 'utf8')))
    expect(errors).toEqual([])
    const idx = JSON.parse(readFileSync(join(import.meta.dirname, '../../public/data/index.json'), 'utf8'))
    const written = idx.courses.map((m: any) => node(m.slug, { requires: m.prerequisites, recommendedBefore: m.recommendedBefore, next: m.next }))
    expect(validateGraph([...written, ...planned])).toEqual([])
    // the plan: foundations → diskret → olympiade, python → algoritmer → c → c++/c#, c → arkitektur → asm → antivirus
    const by = new Map([...written, ...planned].map((n) => [n.slug, n]))
    expect(by.get('foundations')!.next).toEqual(expect.arrayContaining(['diskret-matematik', 'lineaer-algebra-analyse', 'quant']))
    expect(by.get('olympiade-matematik')!.requires).toEqual(['diskret-matematik'])
    expect(by.get('aktuar')!.requires).toEqual(['lineaer-algebra-analyse', 'sandsynlighed'])
    expect(by.get('c')!.next).toEqual(['cpp', 'csharp', 'computerarkitektur-os'])
    expect(by.get('antivirus-projekt')!.requires).toEqual(['asm'])
    expect(by.get('cybersikkerhed')!.requires).toEqual(['netvaerk', 'kryptografi'])
    expect(by.get('python')!.recommendedBefore).toEqual(['linux-shell'])
    expect(by.get('hedgefund')!.requires).toContain('quant')
  })
  it('fails on unknown slugs, self references and cycles', () => {
    const issues = validateGraph([node('a', { next: ['b'] }), node('b', { requires: ['zz'], next: ['c'] }), node('c', { next: ['a'] }), node('d', { requires: ['d'] })])
    expect(issues.map((i) => i.message)).toEqual([
      '"requires: zz" er ikke et kursus (heller ikke et planlagt i content/course-graph.yaml).',
      '"requires" peger på kurset selv.',
      'rækkefølgen går i ring: a → b → c → a.',
    ])
  })
  it('a course cannot be both written and planned', () => {
    expect(validateGraph([node('x'), node('x', { planned: true })])[0].message).toMatch(/både skrevet og planlagt/)
  })
})

describe('an uploaded course in the graph', async () => {
  const { prepareCourse } = await import('@/lib/courses/builder')
  const fixture = readFileSync(join(import.meta.dirname, '../fixtures/testkursus.md'), 'utf8')
  const index = JSON.parse(readFileSync(join(import.meta.dirname, '../../public/data/index.json'), 'utf8'))
  it('may point at written and planned courses', () => {
    const ok = prepareCourse(fixture.replace('requires: []', 'requires: [foundations]').replace('next: []', 'next: [diskret-matematik]'), 't.md', index)
    expect(ok.errors).toEqual([])
  })
  it('is stopped by an unknown slug or a cycle', () => {
    const unknown = prepareCourse(fixture.replace('requires: []', 'requires: [kvantefysik]'), 't.md', index)
    expect(unknown.errors.map((e) => e.message)).toEqual([expect.stringMatching(/"requires: kvantefysik" er ikke et kursus/)])
    const cycle = prepareCourse(fixture.replace('requires: []', 'requires: [quant]').replace('next: []', 'next: [foundations]'), 't.md', index)
    expect(cycle.errors.map((e) => e.message)).toEqual([expect.stringMatching(/går i ring/)])
  })
})
