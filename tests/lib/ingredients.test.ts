// tests/lib/ingredients.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeIngredientName } from '@/lib/ingredients'

describe('normalizeIngredientName', () => {
  it('lowercases and trims', () => {
    expect(normalizeIngredientName('  Chicken Breast  ')).toBe('chicken breast')
  })

  it('stems plural to singular', () => {
    expect(normalizeIngredientName('tomatoes')).toBe('tomato')
    expect(normalizeIngredientName('onions')).toBe('onion')
    expect(normalizeIngredientName('potatoes')).toBe('potato')
    expect(normalizeIngredientName('carrots')).toBe('carrot')
    expect(normalizeIngredientName('mushrooms')).toBe('mushroom')
    expect(normalizeIngredientName('eggs')).toBe('egg')
  })

  it('preserves unknown multi-word names', () => {
    expect(normalizeIngredientName('Olive Oil')).toBe('olive oil')
  })
})
