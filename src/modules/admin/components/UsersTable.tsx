'use client'

import { Avatar, Badge, Group, Select, Table, Text } from '@mantine/core'
import { ROLE_LABELS } from 'auth'
import { notifyError, notifyInfo } from 'common/utils'
import { useState } from 'react'

import { updateUserRole } from '../api'
import type { AdminUser } from '../types'

const ROLE_OPTIONS = [
  { value: 'GUEST', label: 'Gość' },
  { value: 'USER', label: 'Użytkownik' },
  { value: 'EDITOR', label: 'Redaktor' },
]

interface UsersTableProps {
  users: AdminUser[]
}

export default function UsersTable({ users: initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, role: string | null) => {
    if (!role || role === 'ROOT') return

    setPendingId(userId)
    try {
      await updateUserRole(userId, role as Exclude<AdminUser['role'], 'ROOT'>)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: role as AdminUser['role'] } : u)),
      )
      notifyInfo(`Zmieniono rolę na „${ROLE_LABELS[role as Exclude<AdminUser['role'], 'ROOT'>]}”.`)
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Nie udało się zmienić roli.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Table verticalSpacing="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Użytkownik</Table.Th>
          <Table.Th>Rola</Table.Th>
          <Table.Th>Dołączył</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {users.map((user) => (
          <Table.Tr key={user.id}>
            <Table.Td>
              <Group gap="sm">
                <Avatar
                  src={user.image ?? undefined}
                  alt={user.name ?? user.email ?? ''}
                  radius="xl"
                  size="sm"
                />
                <div>
                  <Text size="sm" fw={500}>
                    {user.name ?? 'Bez nazwy'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {user.email}
                  </Text>
                </div>
              </Group>
            </Table.Td>
            <Table.Td>
              {user.role === 'ROOT' ? (
                <Badge color="mangetsu">Administrator</Badge>
              ) : (
                <Select
                  data={ROLE_OPTIONS}
                  value={user.role}
                  onChange={(value) => handleRoleChange(user.id, value)}
                  disabled={pendingId === user.id}
                  size="xs"
                  w={160}
                  allowDeselect={false}
                />
              )}
            </Table.Td>
            <Table.Td>
              <Text size="sm" c="dimmed">
                {new Date(user.createdAt).toLocaleDateString('pl-PL')}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
