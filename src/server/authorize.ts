import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { Role } from '../generated/prisma/enums'
import { auth } from './auth'

export async function requireRole(allowed: Role[]) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Wymagane logowanie.' }, { status: 401 })
  }
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: 'Brak uprawnień.' }, { status: 403 })
  }

  return { session }
}

export function verifyOrigin(request: NextRequest) {
  const originHeader = request.headers.get('origin')
  const hostHeader = request.headers.get('host')

  if (!originHeader || !hostHeader) {
    return NextResponse.json({ error: 'Brak nagłówka Origin.' }, { status: 403 })
  }

  let origin: URL
  try {
    origin = new URL(originHeader)
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy nagłówek Origin.' }, { status: 403 })
  }

  if (origin.host !== hostHeader) {
    return NextResponse.json({ error: 'Nieprawidłowe pochodzenie żądania.' }, { status: 403 })
  }

  return null
}
