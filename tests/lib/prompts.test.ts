// tests/lib/prompts.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildMealUserPrompt, buildWeekUserPrompt } from '@/lib/prompts'
import { DEFAULT_PREFERENCES } from '@/lib/types'

describe('buildSystemPrompt', () => {
  it('mentions Belgium and JSON', () => {
    const p = buildSystemPrompt()
    expect(p).toContain('Belgian')
    expect(p).toContain('JSON')
  })
})

describe('buildMealUserPrompt', () => {
  it('includes diet type from prefs', () => {
    const p = buildMealUserPrompt({ ...DEFAULT_PREFERENCES, dietType: 'vegetarian' }, [])
    expect(p).toContain('vegetarian')
  })

  it('includes avoid list when provided', () => {
    const p = buildMealUserPrompt(DEFAULT_PREFERENCES, ['Spaghetti Bolognese', 'Moules Frites'])
    expect(p).toContain('Spaghetti Bolognese')
    expect(p).toContain('Moules Frites')
  })

  it('includes JSON schema hint', () => {
    const p = buildMealUserPrompt(DEFAULT_PREFERENCES, [])
    expect(p).toContain('"name"')
    expect(p).toContain('"ingredients"')
  })
})

describe('buildWeekUserPrompt', () => {
  it('requests exactly 7 meals', () => {
    const p = buildWeekUserPrompt(DEFAULT_PREFERENCES)
    expect(p).toContain('7')
  })
})
