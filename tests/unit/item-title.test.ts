import { describe, expect, it } from 'vitest'
import { cleanItemTitle } from '../../scripts/lib/course-build'

const pdf = 'https://courses.csail.mit.edu/6.042/spring15/mcs.pdf'

describe('video and reading titles for the learner', () => {
  it('drops the author markers, also inside emphasis, but keeps "avanceret"', () => {
    expect(cleanItemTitle('*(tilføjet, valgfri)* MIT-bogen', { found: true, urls: [] })).toBe('MIT-bogen')
    expect(cleanItemTitle('**(tilføjet)** Computerphile', { found: true, urls: [] })).toBe('Computerphile')
    expect(cleanItemTitle('**(valgfri) P7 L1 "Automata"**', { found: true, urls: [] })).toBe('**P7 L1 "Automata"**')
    expect(cleanItemTitle('Crashes (YaleCourses) — (valgfri, avanceret)', { found: true, urls: [] })).toBe('Crashes (YaleCourses) — (avanceret)')
    expect(cleanItemTitle('Kategorier (Milewski)', { found: true, urls: [] })).toBe('Kategorier (Milewski)')
  })

  it('removes URLs that are already a player or a link button, with the colon before them', () => {
    expect(cleanItemTitle(`Kapitlet "Infinite Sets": ${pdf}`, { found: true, urls: [pdf] })).toBe('Kapitlet "Infinite Sets"')
    expect(cleanItemTitle(`Spillet (i browseren): ${pdf} — spil Tutorial World.`, { found: true, urls: [pdf] })).toBe('Spillet (i browseren) — spil Tutorial World.')
    expect(cleanItemTitle(`[bogen](${pdf})`, { found: true, urls: [pdf] })).toBe(`[bogen](${pdf})`)
  })

  it('keeps the search hint until the video is found', () => {
    const title = '(tilføjet) MU-puslespillet (søg: "MU puzzle Hofstadter")'
    expect(cleanItemTitle(title, { found: false, urls: [] })).toBe('MU-puslespillet (søg: "MU puzzle Hofstadter")')
    expect(cleanItemTitle(title, { found: true, urls: [] })).toBe('MU-puslespillet')
    expect(cleanItemTitle('Søgeplads: én forelæsning om eksekvering (søg: "Almgren Chriss")', { found: true, urls: [] })).toBe('Én forelæsning om eksekvering')
  })
})
