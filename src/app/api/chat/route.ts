import { NextRequest, NextResponse } from 'next/server'
import { requireRole, verifyOrigin } from 'server/authorize'
import {
  buildPromptContext,
  createChatStream,
  getRequestDate,
  parseChatRequest,
  reserveRateLimit,
} from 'server/chat'
import { isPromptInjection } from 'server/guardrails'

export async function POST(request: NextRequest) {
  const originError = verifyOrigin(request)
  if (originError) return originError

  const authResult = await requireRole(['USER', 'EDITOR', 'ROOT'])
  if (authResult instanceof NextResponse) return authResult
  const { session } = authResult

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy format żądania.' }, { status: 400 })
  }

  const parsed = parseChatRequest(body)
  if (parsed instanceof NextResponse) return parsed
  const { message: searchQuery, sessionId } = parsed

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const requestDate = getRequestDate()

  // Run the guardrail classification alongside RAG context building so its latency
  // is hidden behind the existing search/embedding round-trip.
  const [injectionDetected, context] = await Promise.all([
    isPromptInjection(searchQuery),
    buildPromptContext(searchQuery, sessionId),
  ])

  if (injectionDetected) {
    return NextResponse.json({ error: 'Nieprawidłowe zapytanie.' }, { status: 400 })
  }

  const reservation = await reserveRateLimit(session.user.id, requestDate)
  if (reservation instanceof NextResponse) return reservation

  const { systemPrompt, history, existingConversationId } = context

  const stream = createChatStream({
    searchQuery,
    systemPrompt,
    history,
    existingConversationId,
    sessionId,
    userId: session.user.id,
    ip,
    requestDate,
    requestsUsed: reservation.count,
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
