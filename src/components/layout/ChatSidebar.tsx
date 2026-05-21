'use client'

import { Box, Button, Divider, Group, Stack, Text } from '@mantine/core'

const PANEL_WIDTH = { width: '20vw', maxWidth: 300, flexShrink: 0 }

interface ChatSidebarProps {
  requestsUsed?: number
  requestsTotal?: number
}

export default function ChatSidebar({ requestsUsed = 0, requestsTotal = 10 }: ChatSidebarProps) {
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
        >
          + Nowy czat
        </Button>
      </Box>

      <Divider />

      <Stack style={{ flex: 1, overflow: 'auto' }} p="md" gap="xs">
        <Text size="xs" c="dimmed" ta="center" mt="sm">
          Brak historii czatów
        </Text>
      </Stack>

      <Divider />

      <Box p="md">
        <Text size="xs" c="dimmed">
          Zapytania dzisiaj
        </Text>
        <Group gap="xs" mt={4} align="baseline">
          <Text fw={700} size="sm" c="mangetsu.4">
            {requestsUsed}/{requestsTotal}
          </Text>
          <Text size="xs" c="dimmed">
            wykorzystanych
          </Text>
        </Group>
      </Box>
    </Box>
  )
}
