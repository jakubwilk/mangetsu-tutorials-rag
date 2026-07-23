'use client'

import { Button, type CSSProperties } from '@mantine/core'
import { IconBrandDiscord } from '@tabler/icons-react'
import { signIn } from 'next-auth/react'

const hoverVars = {
  '--button-hover': '#E0E3FF',
  '--button-hover-color': 'var(--mantine-color-black)',
} as CSSProperties

export default function DiscordSignInButton() {
  return (
    <Button
      size="lg"
      radius="md"
      color="discord"
      fz="1rem"
      fw={500}
      style={hoverVars}
      leftSection={<IconBrandDiscord size={20} />}
      onClick={() => signIn('discord', { redirectTo: '/' })}
    >
      Zaloguj przez Discord
    </Button>
  )
}
