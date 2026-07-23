import { Box, Stack, Text } from '@mantine/core'
import { AuthErrorNotice, DiscordSignInButton } from 'auth'
import { Logo } from 'common'
import { redirect } from 'next/navigation'
import { auth } from 'server/auth'

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  if (session) redirect('/')

  const { error } = await searchParams

  return (
    <Box className="flex h-full items-center justify-center">
      {error && <AuthErrorNotice error={error} />}
      <Stack align="center" gap="md">
        <Stack align="center" gap={8}>
          <Logo />
          <Text c="dimmed" size="sm" ta="center" maw={320}>
            Zaloguj się przez Discord, aby korzystać z asystenta poradnikowego.
          </Text>
        </Stack>
        <DiscordSignInButton />
      </Stack>
    </Box>
  )
}
