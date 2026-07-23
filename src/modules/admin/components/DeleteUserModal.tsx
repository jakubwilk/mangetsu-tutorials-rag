'use client'

import { Avatar, Button, Group, Modal, Stack, Switch, Text } from '@mantine/core'
import { useState } from 'react'

import type { AdminUser } from '../types'

interface DeleteUserModalProps {
  user: AdminUser | null
  loading: boolean
  onClose: () => void
  onConfirm: (userId: string, notify: boolean) => void
}

export default function DeleteUserModal({
  user,
  loading,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  const [notify, setNotify] = useState(false)

  const handleClose = () => {
    setNotify(false)
    onClose()
  }

  return (
    <Modal opened={!!user} onClose={handleClose} title="Usuń użytkownika" centered>
      {user && (
        <Stack gap="md">
          <Group gap="sm">
            <Avatar src={user.image ?? undefined} alt={user.name ?? user.email ?? ''} radius="xl" />
            <div>
              <Text size="sm" fw={500}>
                {user.name ?? 'Bez nazwy'}
              </Text>
              <Text size="xs" c="dimmed">
                {user.email}
              </Text>
            </div>
          </Group>
          <Text size="sm" c="dimmed">
            Tej operacji nie można cofnąć. Konto, sesje i limity zapytań tego użytkownika zostaną
            trwale usunięte.
          </Text>
          <Switch
            label="Wyślij powiadomienie"
            checked={notify}
            onChange={(e) => setNotify(e.currentTarget.checked)}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" color="gray" onClick={handleClose} disabled={loading}>
              Anuluj
            </Button>
            <Button color="red" loading={loading} onClick={() => onConfirm(user.id, notify)}>
              Usuń
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
