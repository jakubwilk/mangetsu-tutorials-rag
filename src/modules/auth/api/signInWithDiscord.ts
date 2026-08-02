'use server'

import { signIn } from 'server/auth'

export async function signInWithDiscord(): Promise<void> {
  await signIn('discord', { redirectTo: '/' })
}
