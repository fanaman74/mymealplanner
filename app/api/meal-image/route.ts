// app/api/meal-image/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface MealDBMeal {
  strMealThumb: string
  strInstructions?: string
}

interface MealDBResponse {
  meals: MealDBMeal[] | null
}

function parseSteps(raw: string): string[] {
  // Split on numbered patterns like "1.", "STEP 1", or double newlines
  const byNumbered = raw.split(/\r?\n(?=\d+[\.\)]|\bSTEP\s+\d+)/i).map(s => s.replace(/^\d+[\.\)]\s*/, '').replace(/^STEP\s+\d+[:\s]*/i, '').trim()).filter(s => s.length > 10)
  if (byNumbered.length >= 3) return byNumbered

  // Fallback: split on double newlines
  const byPara = raw.split(/\r?\n\r?\n/).map(s => s.replace(/\r?\n/g, ' ').trim()).filter(s => s.length > 10)
  if (byPara.length >= 2) return byPara

  // Last resort: single long paragraph — split on sentences
  return raw.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 20) ?? [raw.trim()]
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ imageUrl: null, steps: null })

  const queries = [q, q.split(' ')[0]].filter(Boolean)

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
        { next: { revalidate: 86400 } },
      )
      if (!res.ok) continue
      const data: MealDBResponse = await res.json()
      const meal = data.meals?.[0]
      if (!meal) continue

      const steps = meal.strInstructions ? parseSteps(meal.strInstructions) : null

      return NextResponse.json(
        { imageUrl: meal.strMealThumb ?? null, steps },
        { headers: { 'Cache-Control': 'public, max-age=86400' } },
      )
    } catch {
      continue
    }
  }

  return NextResponse.json({ imageUrl: null, steps: null })
}
