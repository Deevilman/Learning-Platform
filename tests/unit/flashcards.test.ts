import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkTyped, flashcardSession } from '@/lib/flashcards'
import { DAY, newCard, review } from '@/lib/srs'
import type { Flashcard } from '@/types/content'

const card = (id: string, o: Partial<Flashcard> = {}): Flashcard => ({ id, kind: 'da-en', front: id, back: id, answer: id, ...o })

describe('flashcards', () => {
  it('are built from the glossaries and the formula tables', () => {
    const quant = JSON.parse(readFileSync(join(import.meta.dirname, '../../public/data/courses/quant.json'), 'utf8'))
    const kinds = new Set(quant.flashcards.map((c: Flashcard) => c.kind))
    expect([...kinds].sort()).toEqual(['da-en', 'en-da', 'formula'])
    expect(new Set(quant.flashcards.map((c: Flashcard) => c.id)).size).toBe(quant.flashcards.length)
    const sharpe = quant.flashcards.find((c: Flashcard) => c.kind === 'formula' && c.front.includes('Sharpe'))
    expect(sharpe.back).toContain('katex')
    expect(sharpe.answer).toBeUndefined() // formulas are flip-only
  })
  it('shows due cards first, then a few new ones, using the exercise scheduler', () => {
    const now = 100 * DAY
    const seen = review(newCard('b', 0), 0, now - 2 * DAY) // due again after a lapse
    const later = review(review(newCard('c', 0), 3, now - DAY), 3, now)
    const srs = new Map([
      ['b', seen],
      ['c', later],
    ])
    const cards = [card('a', { week: 2 }), card('b'), card('c'), card('d', { week: 1 }), card('f', { kind: 'formula', answer: undefined })]
    expect(flashcardSession(cards, srs, now, 'flip', 2).map((c) => c.id)).toEqual(['b', 'd', 'a'])
    expect(flashcardSession(cards, srs, now, 'type').map((c) => c.id)).not.toContain('f')
  })
  it('accepts alternatives and forgives one typo in a long word', () => {
    const c = card('x', { answer: 'Survivorship bias / overlevelsesbias' })
    expect(checkTyped(c, 'survivorship bias')).toBe('exact')
    expect(checkTyped(c, 'Overlevelsesbias')).toBe('exact')
    expect(checkTyped(c, 'survivorshp bias')).toBe('close')
    expect(checkTyped(c, 'bias')).toBe('wrong')
    expect(checkTyped(card('y', { answer: 'kovarians' }), 'Kovarians.')).toBe('exact')
  })
})
