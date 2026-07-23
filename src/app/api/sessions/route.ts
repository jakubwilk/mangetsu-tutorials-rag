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
