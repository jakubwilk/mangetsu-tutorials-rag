'use client'

import { Button, type ButtonProps } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'
import { signOut } from 'next-auth/react'

export default function SignOutButton(props: ButtonProps) {
  return (
    <Button
      variant="subtle"
      color="gray"
      leftSection={<IconLogout size={16} />}
      onClick={() => signOut({ redirectTo: '/login' })}
      {...props}
    >
      Wyloguj
    </Button>
  )
}
