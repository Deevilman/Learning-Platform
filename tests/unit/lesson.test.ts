// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { splitLesson } from '@/lib/lesson'

const long = 'Lang forklaring. '.repeat(20)

describe('bite-sized lessons', () => {
  it('splits numbered sections into steps and keeps "Prøv selv" with the step before', () => {
    const html = [
      `<p><strong>1. Sandsynlighedsrum.</strong> ${long}</p>`,
      `<p><strong>2. Bayes.</strong> ${long}</p>`,
      `<p><strong>Sætning.</strong> ${long}</p>`,
      `<p><strong>Prøv selv:</strong> Tæl i gitteret.</p>`,
      `<div class="interactive" data-interactive="bayes"></div>`,
      `<p><strong>3. Uafhængighed.</strong> ${long}</p>`,
    ].join('\n')
    const steps = splitLesson(html)
    expect(steps.map((s) => s.title)).toEqual(['Sandsynlighedsrum', 'Bayes', 'Uafhængighed'])
    expect(steps[1].html).toContain('data-interactive="bayes"')
    expect(steps[1].html).toContain('Sætning.')
  })

  it('uses bold leads when sections are not numbered, and merges very short steps', () => {
    const html = [`<p><strong>Udsagn (proposition).</strong> ${long}</p>`, `<p><strong>Formler.</strong> Kort.</p>`, `<p><strong>Implikation.</strong> ${long}</p>`].join('\n')
    const steps = splitLesson(html)
    expect(steps.map((s) => s.title)).toEqual(['Udsagn', 'Implikation'])
    expect(steps[0].html).toContain('Formler.')
  })

  it('splits every real week into several steps without losing content', () => {
    for (const [c, w] of [['foundations', 1], ['quant', 3], ['hedgefund', 5]] as const) {
      const week = JSON.parse(readFileSync(join(import.meta.dirname, `../../public/data/courses/${c}/week-${w}.json`), 'utf8'))
      const steps = splitLesson(week.notes)
      expect(steps.length, `${c} uge ${w}`).toBeGreaterThanOrEqual(4)
      const text = (h: string) => {
        const d = document.createElement('div')
        d.innerHTML = h
        return (d.textContent || '').replace(/\s+/g, '')
      }
      expect(text(steps.map((s) => s.html).join(''))).toBe(text(week.notes))
    }
  })
})
