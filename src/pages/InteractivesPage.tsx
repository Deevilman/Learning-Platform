import { useState } from 'react'
import { interactiveIds } from '@/lib/interactives'
import { generators } from '@/lib/generators'
import { randomSeed } from '@/lib/rng'
import { miniMarkdown } from '@/lib/mini-md'
import { Html } from '@/components/Html'
import { STARS } from '@/components/ExerciseCard'
import { Link } from 'react-router-dom'

export default function InteractivesPage() {
  const [open, setOpen] = useState<string | null>(null)
  const [sample, setSample] = useState<{ id: string; seed: number; d: 1 | 2 | 3 } | null>(null)
  const byCourse = new Map<string, typeof generators>()
  for (const g of generators) byCourse.set(g.course, [...(byCourse.get(g.course) || []), g])
  const g = sample && generators.find((x) => x.id === sample.id)
  const ex = g && sample ? g.generate(sample.seed, sample.d) : null
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Interaktive værktøjer og generatorer</h1>
        <p className="muted">
          {interactiveIds.length} interaktive komponenter (de står også i noterne, hvor de hører til) og {generators.length} opgavegeneratorer til <Link className="link" to="/traen">træningen</Link>.
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Interaktive komponenter</h2>
        <div className="flex flex-wrap gap-2">
          {interactiveIds.map((id) => (
            <button key={id} className="btn" aria-pressed={open === id} style={open === id ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined} onClick={() => setOpen(open === id ? null : id)}>
              {id}
            </button>
          ))}
        </div>
        {open && <Html key={open} html={`<div class="interactive" data-interactive="${open}" data-props="{}"></div>`} />}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Opgavegeneratorer</h2>
        {[...byCourse.entries()].map(([course, list]) => (
          <div key={course} className="card">
            <h3 className="mb-2 font-semibold">{course}</h3>
            <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
              {list.map((x) => (
                <li key={x.id} className="flex items-center gap-2">
                  <button className="link text-left" onClick={() => setSample({ id: x.id, seed: randomSeed(), d: x.difficulties[Math.floor(x.difficulties.length / 2)] })}>
                    {x.title}
                  </button>
                  <span className="muted text-xs">{x.difficulties.map((d) => STARS[d]).join(' ')}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {ex && g && sample && (
          <div className="card space-y-3" style={{ borderColor: 'var(--accent)' }}>
            <div className="flex flex-wrap items-center gap-2">
              <b>{g.title}</b>
              {g.difficulties.map((d) => (
                <button key={d} className="btn" aria-pressed={sample.d === d} onClick={() => setSample({ ...sample, d })}>
                  {STARS[d]}
                </button>
              ))}
              <button className="btn" onClick={() => setSample({ ...sample, seed: randomSeed() })}>
                Ny variant
              </button>
            </div>
            <Html html={miniMarkdown(ex.prompt)} />
            <details>
              <summary className="cursor-pointer font-semibold">Løsning</summary>
              <Html html={miniMarkdown(ex.solution)} />
            </details>
          </div>
        )}
      </section>
    </div>
  )
}
