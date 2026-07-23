import { Box, Stack, Text } from '@mantine/core'
import type { AdminUser } from 'admin'
import { AdminHeader, UsersTable } from 'admin'
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
    <div className="flex h-full flex-col">
      <AdminHeader />
      <Box p="xl" className="overflow-auto">
        <Stack gap="lg">
          <div>
            <Text size="xl" fw={700}>
              Panel administracyjny
            </Text>
            <Text size="sm" c="dimmed">
              Zarządzanie rolami użytkowników. Rola ROOT nadawana jest wyłącznie bezpośrednio w
              bazie danych.
            </Text>
          </div>
          <UsersTable users={adminUsers} />
        </Stack>
      </Box>
    </div>
  )
}
