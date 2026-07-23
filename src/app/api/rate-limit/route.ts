import { NextResponse } from 'next/server'
import { requireRole } from 'server/authorize'
import { getRequestDate } from 'server/chat'
import { db } from 'server/db'

export async function GET() {
  const authResult = await requireRole(['USER', 'EDITOR', 'ROOT'])
  if (authResult instanceof NextResponse) return authResult
  const { session } = authResult

  const requestDate = getRequestDate()

  try {
    const rateLimit = await db.rateLimit.findUnique({
      where: { userId_requestDate: { userId: session.user.id, requestDate } },
    })

    return NextResponse.json({ requestsUsed: rateLimit?.count ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
