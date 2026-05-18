// app/api/cooking-instructions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Ingredient } from '@/lib/types'

interface RequestBody {
  mealName: string
  ingredients: Ingredient[]
  prepTime?: string
  lang?: 'en' | 'fr' | 'nl'
  model?: string
}

const LANG_INSTRUCTIONS: Record<string, string> = {
  en: 'Respond in English.',
  fr: 'Réponds en français.',
  nl: 'Antwoord in het Nederlands.',
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { mealName, ingredients, prepTime, lang = 'en', model = 'anthropic/claude-3-haiku' } = body
  const apiKey = process.env.OPENROUTER_API_KEY || ''
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 400 })

  const ingredientList = ingredients
    .map(i => `- ${i.quantity} ${i.unit} ${i.name}`)
    .join('\n')

  const prompt = `You are a helpful cooking assistant. Generate clear, numbered step-by-step cooking instructions for the following meal.

Meal: ${mealName}${prepTime ? ` (prep time: ${prepTime})` : ''}

Ingredients:
${ingredientList}

${LANG_INSTRUCTIONS[lang] ?? LANG_INSTRUCTIONS.en}

Return ONLY a JSON object in this exact format:
{
  "steps": [
    "Step description here",
    "Next step here"
  ],
  "tips": "Optional single tip or empty string"
}

Generate 6-9 practical, easy-to-follow steps. No markdown, no preamble.`

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('OpenRouter error:', res.status, errText)
      return NextResponse.json({ error: `AI service error (${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    const steps: string[] = Array.isArray(parsed.steps) ? parsed.steps : []
    const tips: string = typeof parsed.tips === 'string' ? parsed.tips : ''

    return NextResponse.json({ steps, tips })
  } catch {
    return NextResponse.json({ error: 'Failed to generate instructions' }, { status: 500 })
  }
}
