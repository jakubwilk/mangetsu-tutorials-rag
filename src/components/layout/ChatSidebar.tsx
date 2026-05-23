'use client'

import { Box, Button, Divider, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { useSyncExternalStore } from 'react'

import { chatStore } from '@/store'

const PANEL_WIDTH = { width: '20vw', maxWidth: 300, flexShrink: 0 }

function getSessionPreview(messages: { role: string; content: string }[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return 'Nowy czat'
  return first.content.length > 40 ? first.content.slice(0, 40) + '…' : first.content
}

export default function ChatSidebar() {
  const { sessions, activeSessionId, requestsUsed } = useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getSnapshot,
    chatStore.getServerSnapshot
  )

  const visibleSessions = sessions.filter((s) => s.messages.length > 0)

  return (
    <Box
      component="nav"
      style={{
        ...PANEL_WIDTH,
        borderRight: '1px solid var(--mantine-color-dark-5)',
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
            <UnstyledButton
              key={session.id}
              onClick={() => chatStore.switchSession(session.id)}
              style={{
                padding: '6px 8px',
                borderRadius: 6,
                background:
                  session.id === activeSessionId
                    ? 'var(--mantine-color-dark-5)'
                    : 'transparent',
              }}
            >
              <Text size="xs" c={session.id === activeSessionId ? 'white' : 'dimmed'} truncate>
                {getSessionPreview(session.messages)}
              </Text>
            </UnstyledButton>
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
            {requestsUsed}/{chatStore.requestLimit}
          </Text>
          <Text size="xs" c="dimmed">
            wykorzystanych
          </Text>
        </Group>
      </Box>
    </Box>
  )
}
