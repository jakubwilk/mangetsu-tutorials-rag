import { Box, Button, Group, Stack, Text } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import type { AdminUser } from 'admin'
import { UsersTable } from 'admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from 'server/auth'
import { db } from 'server/db'

export default async function AdminPage() {
  const session = await auth()
  if (session?.user.role !== 'ROOT') notFound()

  const users = await db.user.findMany({ orderBy: { createdAt: 'desc' } })
  const adminUsers: AdminUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xl" fw={700}>
              Panel administracyjny
            </Text>
            <Text size="sm" c="dimmed">
              Zarządzanie rolami użytkowników. Rola ROOT nadawana jest wyłącznie bezpośrednio w
              bazie danych.
            </Text>
          </div>
          <Button
            component={Link}
            href="/"
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
          >
            Powrót do czatu
          </Button>
        </Group>
        <UsersTable users={adminUsers} />
      </Stack>
    </Box>
  )
}
