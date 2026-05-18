// lib/hellofresh.ts
import type { HFMeal } from '@/app/api/hellofresh-meals/route'
import type { Meal, Unit } from '@/lib/types'

function mapUnit(raw: string): Unit {
  const u = raw.toLowerCase().trim()
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return 'kg'
  if (u === 'g' || u === 'gram' || u === 'grams') return 'g'
  if (u === 'ml' || u === 'milliliter' || u === 'milliliters' || u === 'millilitre') return 'ml'
  if (u === 'l' || u === 'liter' || u === 'litre' || u === 'liters') return 'l'
  if (u.startsWith('tbsp') || u === 'tablespoon' || u === 'tablespoons') return 'tbsp'
  if (u.startsWith('tsp') || u === 'teaspoon' || u === 'teaspoons') return 'tsp'
  if (u === 'cup' || u === 'cups') return 'cup'
  return 'pcs'
}

export function hfToMeal(hf: HFMeal): Meal {
  return {
    id: hf.id,
    name: hf.name,
    cuisine: hf.cuisines[0] ?? '',
    prepTime: `${hf.prepTime} min`,
    ingredients: hf.ingredients.map(i => ({
      name: i.name.toLowerCase(),
      quantity: i.amount || 1,
      unit: mapUnit(i.unit),
    })),
  }
}

export function buildHFParams(prefs: { dietType: string; cuisines: string[] }): URLSearchParams {
  const p = new URLSearchParams({ take: '30' })
  if (prefs.dietType && prefs.dietType !== 'omnivore') p.set('dietType', prefs.dietType)
  for (const c of prefs.cuisines) p.append('cuisines', c)
  return p
}
