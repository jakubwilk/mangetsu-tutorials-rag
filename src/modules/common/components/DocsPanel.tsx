'use client'

import { Box, ScrollArea, Text, Typography } from '@mantine/core'
import ReactMarkdown from 'react-markdown'

const PANEL_WIDTH = { width: '20vw', maxWidth: 300, flexShrink: 0 }

interface DocsPanelProps {
  content: string
  fluid?: boolean
}

export default function DocsPanel({ content, fluid = false }: DocsPanelProps) {
  return (
    <Box
      component="aside"
      style={{
        ...(fluid ? { flex: 1 } : { ...PANEL_WIDTH, borderLeft: '1px solid var(--mantine-color-dark-5)' }),
        background: 'var(--mantine-color-dark-8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {!fluid && (
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
      )}

      <ScrollArea className="flex-1 min-h-0" p="md">
        <Typography>
          <ReactMarkdown>{content}</ReactMarkdown>
        </Typography>
      </ScrollArea>
    </Box>
  )
}
