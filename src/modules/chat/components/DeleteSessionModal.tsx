'use client'

import { Button, Group, Modal, Stack, Text } from '@mantine/core'

import type { ChatSession } from '../types'

interface DeleteSessionModalProps {
  session: ChatSession | null
  preview: string
  loading: boolean
  onClose: () => void
  onConfirm: (sessionId: string) => void
}

export default function DeleteSessionModal({
  session,
  preview,
  loading,
  onClose,
  onConfirm,
}: DeleteSessionModalProps) {
  return (
    <Modal opened={!!session} onClose={onClose} title="Usuń czat" centered>
      {session && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Czat „{preview}” zostanie trwale usunięty. Tej operacji nie można cofnąć. Dzienny limit
            zapytań pozostaje bez zmian.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" color="gray" onClick={onClose} disabled={loading}>
              Anuluj
            </Button>
            <Button color="red" loading={loading} onClick={() => onConfirm(session.id)}>
              Usuń
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
