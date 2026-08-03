'use client'

import { ActionIcon, Box, Button, Divider, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { notifyError } from 'common/utils'
import { useState, useSyncExternalStore } from 'react'

import { deleteSession } from '../api'
import { chatStore } from '../store'
import type { ChatSession } from '../types'
import DeleteSessionModal from './DeleteSessionModal'

const PANEL_WIDTH = { width: '20vw', maxWidth: 300, flexShrink: 0 }

function getSessionPreview(messages: { role: string; content: string }[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return 'Nowy czat'
  return first.content.length > 40 ? first.content.slice(0, 40) + '…' : first.content
}

interface ChatSidebarProps {
  fluid?: boolean
}

export default function ChatSidebar({ fluid = false }: ChatSidebarProps) {
  const { sessions, activeSessionId, requestsUsed, requestLimit } = useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getSnapshot,
    chatStore.getServerSnapshot,
  )

  const [sessionPendingDelete, setSessionPendingDelete] = useState<ChatSession | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const visibleSessions = sessions.filter((s) => s.messages.length > 0)

  const handleConfirmDelete = async (sessionId: string) => {
    setIsDeleting(true)
    try {
      await deleteSession(sessionId)
      chatStore.deleteSession(sessionId)
      setSessionPendingDelete(null)
    } catch {
      notifyError('Nie udało się usunąć czatu. Spróbuj ponownie.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Box
      component="nav"
      style={{
        ...(fluid
          ? { flex: 1 }
          : { ...PANEL_WIDTH, borderRight: '1px solid var(--mantine-color-dark-5)' }),
        background: 'var(--mantine-color-dark-8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box p="md">
        <Button
          fullWidth
          variant="filled"
          size="sm"
          className="!bg-white !text-gray-900 hover:!bg-gray-100"
          onClick={() => chatStore.newSession()}
        >
          + Nowy czat
        </Button>
      </Box>

      <Divider />

      <Stack className="flex-1 overflow-auto" p="md" gap={4}>
        {visibleSessions.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" mt="sm">
            Brak historii czatów
          </Text>
        ) : (
          visibleSessions.map((session) => (
            <Group key={session.id} gap={4} wrap="nowrap">
              <UnstyledButton
                onClick={() => chatStore.switchSession(session.id)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '6px 8px',
                  borderRadius: 6,
                  background:
                    session.id === activeSessionId ? 'var(--mantine-color-dark-5)' : 'transparent',
                }}
              >
                <Text size="xs" c={session.id === activeSessionId ? 'white' : 'dimmed'} truncate>
                  {getSessionPreview(session.messages)}
                </Text>
              </UnstyledButton>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => setSessionPendingDelete(session)}
                aria-label="Usuń czat"
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          ))
        )}
      </Stack>

      <Divider />

      <Box p="md">
        <Text size="xs" c="dimmed">
          Zapytania dzisiaj
        </Text>
        <Group gap="xs" mt={4} align="baseline">
          <Text fw={700} size="sm" c="mangetsu.4">
            {requestsUsed}/{requestLimit}
          </Text>
          <Text size="xs" c="dimmed">
            wykorzystanych
          </Text>
        </Group>
      </Box>

      <DeleteSessionModal
        session={sessionPendingDelete}
        preview={sessionPendingDelete ? getSessionPreview(sessionPendingDelete.messages) : ''}
        loading={isDeleting}
        onClose={() => setSessionPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  )
}
