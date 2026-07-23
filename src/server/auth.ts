import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import Discord from 'next-auth/providers/discord'

import { db } from './db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Discord],
  session: { strategy: 'database' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role
      return session
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl

      if (pathname.startsWith('/api/')) {
        if (!auth) return NextResponse.json({ error: 'Wymagane logowanie.' }, { status: 401 })
        return true
      }
      if (pathname === '/login' || pathname === '/pending') return true
      if (!auth) return false
      if (auth.user.role === 'GUEST' && pathname !== '/pending') {
        return Response.redirect(new URL('/pending', request.nextUrl))
      }
      return true
    },
  },
})
