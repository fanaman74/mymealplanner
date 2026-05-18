// app/api/send-shopping-list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

interface RequestBody {
  to: string
  html: string
  subject?: string
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { to, html, subject = 'Your Weekly Shopping List — MyMealPlanner' } = body
  if (!to || !html) return NextResponse.json({ error: 'Missing to or html' }, { status: 400 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

  const resend = new Resend(apiKey)

  const from = process.env.RESEND_FROM_EMAIL ?? 'MyMealPlanner <noreply@cordis-explorer.eu>'

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
