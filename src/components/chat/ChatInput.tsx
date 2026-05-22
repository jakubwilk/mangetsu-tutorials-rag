'use client'

import { ActionIcon, Box, Text, Textarea } from '@mantine/core'
import { useState } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (!value.trim() || disabled) return
    onSend(value)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Box px="xl" pb="xl" pt="md" style={{ flexShrink: 0 }}>
      <Box
        style={{
          maxWidth: 780,
          margin: '0 auto',
          background: 'var(--mantine-color-dark-6)',
          borderRadius: '1rem',
          border: '1px solid var(--mantine-color-dark-4)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
          padding: '0.625rem 0.625rem 0.625rem 1.25rem',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.5rem',
        }}
      >
        <Textarea
          style={{ flex: 1 }}
          variant="unstyled"
          placeholder="Zadaj pytanie…"
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          autosize
          rows={1}
          minRows={1}
          maxRows={6}
          disabled={disabled}
          size="lg"
        />
        <ActionIcon
          size="xl"
          color="mangetsu"
          variant="filled"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          radius="md"
          style={{ flexShrink: 0 }}
          aria-label="Wyślij wiadomość"
        >
          <SendIcon />
        </ActionIcon>
      </Box>
      <Text size="xs" c="dimmed" ta="center" mt="xs">
        Naciśnij Enter, aby wysłać — Shift+Enter wstawia nową linię
      </Text>
    </Box>
  )
}
