// app/api/generate-meal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt, buildMealUserPrompt } from '@/lib/prompts'
import { singleMealResponseSchema } from '@/lib/schemas'
import { Preferences } from '@/lib/types'

interface RequestBody {
  apiKey: string
  model: string
  prefs: Preferences
  avoid: string[]
  lang?: 'en' | 'fr' | 'nl'
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw Object.assign(new Error(text), { status: res.status })
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { apiKey: clientKey, model, prefs, avoid, lang = 'en' } = body
  const apiKey = clientKey || process.env.OPENROUTER_API_KEY || ''
  if (!apiKey) return NextResponse.json({ error: 'Missing apiKey' }, { status: 400 })
  if (!model) return NextResponse.json({ error: 'Missing model' }, { status: 400 })

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildMealUserPrompt(prefs, avoid ?? [])

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callOpenRouter(
        apiKey, model, systemPrompt,
        attempt === 0 ? userPrompt : userPrompt + '\n\nIMPORTANT: Return ONLY the JSON object. No other text.'
      )
      const parsed = JSON.parse(raw)
      const validated = singleMealResponseSchema.parse(parsed)
      const meal = { ...validated, id: crypto.randomUUID() }
      return NextResponse.json({ meal })
    } catch (err: unknown) {
      const isStatusError = err instanceof Error && 'status' in err
      if (isStatusError) {
        const status = (err as Error & { status: number }).status
        if (status === 401) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
        if (status === 429) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
        return NextResponse.json({ error: 'OpenRouter error' }, { status: 502 })
      }
      if (attempt === 1) {
        return NextResponse.json({ error: 'LLM returned invalid response' }, { status: 502 })
      }
    }
  }

  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
}
