'use client'

import { Box, ScrollArea, Text, Typography } from '@mantine/core'
import ReactMarkdown from 'react-markdown'

const PANEL_WIDTH = { width: '20vw', maxWidth: 300, flexShrink: 0 }

interface DocsPanelProps {
  content: string
}

export default function DocsPanel({ content }: DocsPanelProps) {
  return (
    <Box
      component="aside"
      style={{
        ...PANEL_WIDTH,
        borderLeft: '1px solid var(--mantine-color-dark-5)',
        background: 'var(--mantine-color-dark-8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        px="md"
        py="sm"
        className="shrink-0"
        style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}
      >
        <Text size="sm" fw={600} c="dimmed" className="select-none">
          Baza wiedzy
        </Text>
      </Box>

      <ScrollArea className="flex-1" p="md">
        <Typography>
          <ReactMarkdown>{content}</ReactMarkdown>
        </Typography>
      </ScrollArea>
    </Box>
  )
}
