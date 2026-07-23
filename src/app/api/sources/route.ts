import { NextRequest, NextResponse } from 'next/server'
import { requireRole, verifyOrigin } from 'server/authorize'
import { type SourceMethod, submitSourceToWebhook } from 'server/sources'

export async function POST(request: NextRequest) {
  const originError = verifyOrigin(request)
  if (originError) return originError

  const authResult = await requireRole(['EDITOR', 'ROOT'])
  if (authResult instanceof NextResponse) return authResult

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy format żądania.' }, { status: 400 })
  }

  const { method, data } = body

  if (method !== 'URL' && method !== 'CONTENT') {
    return NextResponse.json({ error: 'Nieprawidłowa metoda.' }, { status: 400 })
  }
  if (typeof data !== 'string' || !data.trim()) {
    return NextResponse.json({ error: "Pole 'data' jest wymagane." }, { status: 400 })
  }

  try {
    const message = await submitSourceToWebhook(method as SourceMethod, data.trim())
    return NextResponse.json({ message })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nie udało się dodać źródła.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
