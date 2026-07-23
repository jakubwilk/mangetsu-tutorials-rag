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
