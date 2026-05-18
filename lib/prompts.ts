// lib/prompts.ts
import { Preferences } from '@/lib/types'

type Lang = 'en' | 'fr' | 'nl'

const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  fr: 'French',
  nl: 'Dutch',
}

export function buildSystemPrompt(lang: Lang = 'en'): string {
  return `You are a dinner meal planner for a multicultural family with French, Italian, and Ghanaian roots, living in Belgium.
Output ONLY strict JSON — no prose, no markdown, no explanation outside the JSON object.
Ingredient names must be lowercase singular (e.g. "tomato" not "Tomatoes").
Quantities must use metric units (g, kg, ml, l) or pcs/tbsp/tsp/cup.
Draw from French, Italian, and Ghanaian culinary traditions as well as broader world cuisines.
Ghanaian dishes may include jollof rice, groundnut soup, kelewele, kontomire stew, waakye, fufu, egusi, etc.
Ingredients must be findable in Belgian supermarkets (Colruyt, Delhaize, Albert Heijn).
IMPORTANT: Write all meal names, ingredient names, cuisine names, and prep time strings in ${LANG_NAMES[lang]}.`
}

export function buildMealUserPrompt(prefs: Preferences, avoid: string[], lang: Lang = 'en'): string {
  const avoidLine = avoid.length > 0
    ? `Do NOT suggest any of these meals (already in this week's plan): ${avoid.join(', ')}.`
    : ''

  return `Generate 1 dinner meal for a family of ${prefs.familySize} people.
Diet: ${prefs.dietType}.
Preferred cuisines: ${prefs.cuisines.join(', ') || 'any'}.
Dislikes: ${prefs.dislikes.join(', ') || 'none'}.
Allergies: ${prefs.allergies.join(', ') || 'none'}.
${prefs.weeklyBudget ? `Weekly grocery budget: €${prefs.weeklyBudget}.` : ''}
${prefs.notes ? `Extra notes: ${prefs.notes}` : ''}
${avoidLine}
All text fields in ${LANG_NAMES[lang]}.

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

export function buildWeekUserPrompt(prefs: Preferences, lang: Lang = 'en'): string {
  return `Generate exactly 7 different dinner meals for a family of ${prefs.familySize} people.
Diet: ${prefs.dietType}.
Preferred cuisines: ${prefs.cuisines.join(', ') || 'any'}.
Dislikes: ${prefs.dislikes.join(', ') || 'none'}.
Allergies: ${prefs.allergies.join(', ') || 'none'}.
${prefs.weeklyBudget ? `Weekly grocery budget: €${prefs.weeklyBudget}.` : ''}
${prefs.notes ? `Extra notes: ${prefs.notes}` : ''}
Vary cuisines and proteins across the 7 meals. No duplicates.
All text fields in ${LANG_NAMES[lang]}.

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
