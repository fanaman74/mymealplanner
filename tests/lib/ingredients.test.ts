// tests/lib/ingredients.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeIngredientName, buildShoppingList } from '@/lib/ingredients'
import { Ingredient, WeekPlan, emptyWeekPlan } from '@/lib/types'

function makePlan(ingredientSets: Ingredient[][]): WeekPlan {
  const plan = emptyWeekPlan()
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  ingredientSets.forEach((ingredients, i) => {
    if (days[i]) {
      plan.days[days[i]] = {
        id: `meal-${i}`,
        name: `Meal ${i}`,
        ingredients,
      }
    }
  })
  return plan
}

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

describe('buildShoppingList — unit merging', () => {
  it('sums same ingredient same unit', () => {
    const plan = makePlan([
      [{ name: 'chicken breast', quantity: 300, unit: 'g' }],
      [{ name: 'chicken breast', quantity: 200, unit: 'g' }],
    ])
    const list = buildShoppingList(plan)
    const meat = list.categories.find(c => c.name === 'meat')!
    const item = meat.items.find(i => i.name === 'chicken breast')!
    expect(item.quantity).toBe(500)
    expect(item.unit).toBe('g')
  })

  it('converts g+kg to kg when total >= 1000g', () => {
    const plan = makePlan([
      [{ name: 'potato', quantity: 800, unit: 'g' }],
      [{ name: 'potato', quantity: 400, unit: 'g' }],
    ])
    const list = buildShoppingList(plan)
    const produce = list.categories.find(c => c.name === 'produce')!
    const item = produce.items.find(i => i.name === 'potato')!
    expect(item.quantity).toBeCloseTo(1.2)
    expect(item.unit).toBe('kg')
  })

  it('keeps conflicting unit families as separate items', () => {
    const plan = makePlan([
      [{ name: 'garlic', quantity: 10, unit: 'g' }],
      [{ name: 'garlic', quantity: 3, unit: 'pcs' }],
    ])
    const list = buildShoppingList(plan)
    const allItems = list.categories.flatMap(c => c.items).filter(i => i.name === 'garlic')
    expect(allItems).toHaveLength(2)
  })

  it('skips null meal slots', () => {
    const plan = emptyWeekPlan()
    const list = buildShoppingList(plan)
    expect(list.categories.flatMap(c => c.items)).toHaveLength(0)
  })

  it('normalizes ingredient names before merging', () => {
    const plan = makePlan([
      [{ name: 'Tomatoes', quantity: 200, unit: 'g' }],
      [{ name: 'tomato', quantity: 100, unit: 'g' }],
    ])
    const list = buildShoppingList(plan)
    const produce = list.categories.find(c => c.name === 'produce')!
    const items = produce.items.filter(i => i.name === 'tomato')
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(300)
  })
})

describe('buildShoppingList — categorization', () => {
  it('puts chicken breast in meat', () => {
    const plan = makePlan([[{ name: 'chicken breast', quantity: 400, unit: 'g' }]])
    const list = buildShoppingList(plan)
    const meat = list.categories.find(c => c.name === 'meat')
    expect(meat?.items.find(i => i.name === 'chicken breast')).toBeDefined()
  })

  it('puts unknown ingredient in other', () => {
    const plan = makePlan([[{ name: 'xylitol syrup', quantity: 1, unit: 'pcs' }]])
    const list = buildShoppingList(plan)
    const other = list.categories.find(c => c.name === 'other')
    expect(other?.items.find(i => i.name === 'xylitol syrup')).toBeDefined()
  })
})
