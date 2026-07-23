import { Box, Stack, Text } from '@mantine/core'
import { SignOutButton } from 'auth'
import { Logo } from 'common'
import { redirect } from 'next/navigation'
import { auth } from 'server/auth'

export default async function PendingPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'GUEST') redirect('/')

  return (
    <Box className="flex h-full items-center justify-center">
      <Stack align="center" gap="md" ta="center" maw={420}>
        <Logo />
        <Text size="xl" fw={500}>
          Konto oczekuje na aktywację
        </Text>
        <Text c="dimmed" size="sm">
          Twoje konto zostało utworzone, ale nie ma jeszcze dostępu do czatu. Poczekaj, aż administrator
          je aktywuje.
        </Text>
        <SignOutButton color="red" variant="filled" mt="0.75rem" />
      </Stack>
    </Box>
  )
}
