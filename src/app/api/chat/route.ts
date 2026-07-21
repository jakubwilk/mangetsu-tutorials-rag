import { NextRequest, NextResponse } from 'next/server'
import {
  buildPromptContext,
  checkRateLimit,
  createChatStream,
  getRequestDate,
  parseChatRequest,
} from 'server/chat'

export async function POST(request: NextRequest) {
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

  const rateLimitError = await checkRateLimit(ip, requestDate)
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
