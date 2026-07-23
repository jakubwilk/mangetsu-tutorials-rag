import { NextRequest, NextResponse } from 'next/server'
import { requireRole, verifyOrigin } from 'server/authorize'
import {
  buildPromptContext,
  checkRateLimit,
  createChatStream,
  getRequestDate,
  parseChatRequest,
} from 'server/chat'

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

  const rateLimitError = await checkRateLimit(session.user.id, requestDate)
  if (rateLimitError) return rateLimitError

  const { systemPrompt, history, existingConversationId } = await buildPromptContext(
    searchQuery,
    sessionId,
  )

  const stream = createChatStream({
    searchQuery,
    systemPrompt,
    history,
    existingConversationId,
    sessionId,
    userId: session.user.id,
    ip,
    requestDate,
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
