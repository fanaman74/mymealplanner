// app/api/meal-image/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface MealDBMeal {
  strMealThumb: string
}

interface MealDBResponse {
  meals: MealDBMeal[] | null
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ imageUrl: null })

  // Try exact name first, then first word (e.g. "Spaghetti Carbonara" → "Spaghetti")
  const queries = [q, q.split(' ')[0]].filter(Boolean)

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
        { next: { revalidate: 86400 } },
      )
      if (!res.ok) continue
      const data: MealDBResponse = await res.json()
      const thumb = data.meals?.[0]?.strMealThumb
      if (thumb) {
        return NextResponse.json({ imageUrl: thumb }, {
          headers: { 'Cache-Control': 'public, max-age=86400' },
        })
      }
    } catch {
      continue
    }
  }

  return NextResponse.json({ imageUrl: null })
}
