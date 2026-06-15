import { NextRequest, NextResponse } from 'next/server'

import { openai } from 'server/ai'
import { db } from 'server/db'
import { buildSystemPrompt } from 'server/prompts'
import { searchChunks } from 'search'

const DAILY_LIMIT = parseInt(process.env.DAILY_REQUEST_LIMIT ?? '20', 10)

const STAT_ADVANCEMENT_PATTERN =
  /zwi[eę]kszy[ćc]|ulepsz|awanso|wykupi[ćc]|rozwin|podbij|podnie[sś][ćc]|rang[aąię]|poziom|statystyk[aąię]/i

const INJECTION_PATTERN =
  /ignore\s+(previous\s+)?instructions?|zapomnij\s+(poprzednie\s+)?instrukcj|zignoruj\s+zasady|jeste[sś]\s+teraz|you\s+are\s+now|act\s+as\b|udawaj\s+[żz]e\s+jeste[sś]/i

const MAX_MESSAGE_LENGTH = 1000

const enc = new TextEncoder()
const sseEvent = (data: object) => enc.encode(`data: ${JSON.stringify(data)}\n\n`)

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy format żądania.' }, { status: 400 })
  }

  const { message, sessionId } = body

  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: "Pole 'message' jest wymagane." }, { status: 400 })
  }
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    return NextResponse.json({ error: "Pole 'sessionId' jest wymagane." }, { status: 400 })
  }
  if (INJECTION_PATTERN.test(message)) {
    return NextResponse.json({ error: 'Nieprawidłowe zapytanie.' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = new Date()
  const requestDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const rateLimit = await db.rateLimit.findUnique({
    where: { ip_requestDate: { ip, requestDate } },
  })

  if (rateLimit && rateLimit.count >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: 'Przekroczono dzienny limit zapytań. Spróbuj ponownie jutro.' },
      { status: 429 },
    )
  }

  const searchQuery = message.trim().slice(0, MAX_MESSAGE_LENGTH)
  const needsCostContext = STAT_ADVANCEMENT_PATTERN.test(searchQuery)

  const [chunks, costChunks, existingConversation] = await Promise.all([
    searchChunks(searchQuery),
    needsCostContext
      ? searchChunks('koszt PD sklep wykupienie statystyki', 2)
      : Promise.resolve([]),
    db.conversation.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
      },
    }),
  ])

  const seen = new Set(chunks.map((c) => c.id))
  const merged = [...chunks, ...costChunks.filter((c) => !seen.has(c.id))]
  const systemPrompt = buildSystemPrompt(merged, needsCostContext)
  const history = (existingConversation?.messages ?? [])
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.OVH_AI_MODEL ?? 'Meta-Llama-3.1-70B-Instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: searchQuery },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,
          stream_options: { include_usage: true },
        })

        let fullContent = ''
        let tokensUsed = 0

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content ?? ''
          if (content) {
            fullContent += content
            controller.enqueue(sseEvent({ type: 'token', content }))
          }
          if (chunk.usage) {
            tokensUsed = chunk.usage.total_tokens
          }
        }

        const conversationId =
          existingConversation?.id ?? (await db.conversation.create({ data: { sessionId, ip } })).id

        await db.message.createMany({
          data: [
            { conversationId, role: 'user', content: searchQuery, tokensUsed: 0 },
            { conversationId, role: 'assistant', content: fullContent, tokensUsed },
          ],
        })

        const updatedRateLimit = await db.rateLimit.upsert({
          where: { ip_requestDate: { ip, requestDate } },
          create: { ip, requestDate, count: 1 },
          update: { count: { increment: 1 } },
        })

        controller.enqueue(sseEvent({ type: 'done', requestsUsed: updatedRateLimit.count }))
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'Nieznany błąd'
        controller.enqueue(
          sseEvent({ type: 'error', message: `Błąd połączenia z modelem AI: ${detail}` }),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
