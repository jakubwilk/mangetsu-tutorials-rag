import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from 'server/authorize'
import { db } from 'server/db'

export async function GET(request: NextRequest) {
  const authResult = await requireRole(['USER', 'EDITOR', 'ROOT'])
  if (authResult instanceof NextResponse) return authResult

  const ids = (request.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) ?? []).slice(
    0,
    50,
  )

  if (ids.length === 0) {
    return NextResponse.json({ valid: [] })
  }

  try {
    const conversations = await db.conversation.findMany({
      where: { sessionId: { in: ids } },
      select: { sessionId: true },
    })

    const valid = [...new Set(conversations.map((c) => c.sessionId))]

    return NextResponse.json({ valid })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireRole(['USER', 'EDITOR', 'ROOT'])
  if (authResult instanceof NextResponse) return authResult

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: "Parametr 'id' jest wymagany." }, { status: 400 })
  }

  try {
    // Cascades to `messages` via onDelete: Cascade. Never touches `rate_limits` — the daily
    // limit is a separate counter keyed by userId + date, not derived from conversation history.
    await db.conversation.deleteMany({ where: { sessionId: id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
