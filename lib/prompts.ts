// lib/prompts.ts
import { Preferences } from '@/lib/types'

export function buildSystemPrompt(): string {
  return `You are a Belgian/Flemish family dinner meal planner.
Output ONLY strict JSON — no prose, no markdown, no explanation outside the JSON object.
Ingredient names must be lowercase singular (e.g. "tomato" not "Tomatoes").
Quantities must use metric units (g, kg, ml, l) or pcs/tbsp/tsp/cup.
Meals should suit a family cooking at home in Flanders, Belgium.`
}

export function buildMealUserPrompt(prefs: Preferences, avoid: string[]): string {
  const avoidLine = avoid.length > 0
    ? `Do NOT suggest any of these meals (already in this week's plan): ${avoid.join(', ')}.`
    : ''

  return `Generate 1 dinner meal for a family of ${prefs.familySize} people.
Diet: ${prefs.dietType}.
Preferred cuisines: ${prefs.cuisines.join(', ') || 'any'}.
Dislikes: ${prefs.dislikes.join(', ') || 'none'}.
Allergies: ${prefs.allergies.join(', ') || 'none'}.
Budget tier: ${prefs.budgetTier}.
${prefs.notes ? `Extra notes: ${prefs.notes}` : ''}
${avoidLine}

Return JSON matching this schema exactly:
{
  "name": "string — meal name",
  "prepTime": "string — e.g. '30 min'",
  "cuisine": "string — e.g. 'Belgian'",
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "g|kg|ml|l|pcs|tbsp|tsp|cup" }
  ]
}`
}

export function buildWeekUserPrompt(prefs: Preferences): string {
  return `Generate exactly 7 different dinner meals for a family of ${prefs.familySize} people.
Diet: ${prefs.dietType}.
Preferred cuisines: ${prefs.cuisines.join(', ') || 'any'}.
Dislikes: ${prefs.dislikes.join(', ') || 'none'}.
Allergies: ${prefs.allergies.join(', ') || 'none'}.
Budget tier: ${prefs.budgetTier}.
${prefs.notes ? `Extra notes: ${prefs.notes}` : ''}
Vary cuisines and proteins across the 7 meals. No duplicates.

Return JSON matching this schema exactly:
{
  "meals": [
    {
      "name": "string",
      "prepTime": "string",
      "cuisine": "string",
      "ingredients": [
        { "name": "string", "quantity": number, "unit": "g|kg|ml|l|pcs|tbsp|tsp|cup" }
      ]
    }
  ]
}`
}
