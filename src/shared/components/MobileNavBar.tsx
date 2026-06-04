'use client'

import { Box, Group, Text, UnstyledButton } from '@mantine/core'
import { IconBook2, IconHistory } from '@tabler/icons-react'

interface MobileNavBarProps {
  onOpenSidebar: () => void
  onOpenDocsPanel: () => void
}

export default function MobileNavBar({ onOpenSidebar, onOpenDocsPanel }: MobileNavBarProps) {
  return (
    <Box
      component="nav"
      hiddenFrom="sm"
      className="shrink-0"
      style={{
        borderTop: '1px solid var(--mantine-color-dark-5)',
        background: 'var(--mantine-color-dark-8)',
      }}
    >
      <Group justify="space-around" py="xs">
        <UnstyledButton
          onClick={onOpenSidebar}
          className="flex flex-col items-center gap-1 px-8 py-1"
          aria-label="Historia czatów"
        >
          <IconHistory size={20} color="var(--mantine-color-dimmed)" />
          <Text size="xs" c="dimmed">
            Historia
          </Text>
        </UnstyledButton>

        <UnstyledButton
          onClick={onOpenDocsPanel}
          className="flex flex-col items-center gap-1 px-8 py-1"
          aria-label="Baza wiedzy"
        >
          <IconBook2 size={20} color="var(--mantine-color-dimmed)" />
          <Text size="xs" c="dimmed">
            Baza wiedzy
          </Text>
        </UnstyledButton>
      </Group>
    </Box>
  )
}
