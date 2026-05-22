'use client'

import { Box, Text } from '@mantine/core'
import ReactMarkdown from 'react-markdown'

import type { Message } from './ChatView'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        animation: 'bubble-in 250ms ease',
      }}
    >
      <Box
        style={{
          maxWidth: '75%',
          borderRadius: isUser
            ? 'var(--mantine-radius-lg) var(--mantine-radius-lg) var(--mantine-radius-xs) var(--mantine-radius-lg)'
            : 'var(--mantine-radius-lg) var(--mantine-radius-lg) var(--mantine-radius-lg) var(--mantine-radius-xs)',
          padding: '0.625rem 0.875rem',
          background: isUser
            ? 'var(--mantine-color-mangetsu-7)'
            : 'var(--mantine-color-dark-6)',
        }}
      >
        {isUser ? (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', color: 'white' }}>
            {message.content}
          </Text>
        ) : (
          <Box
            style={{
              fontSize: 'var(--mantine-font-size-sm)',
              lineHeight: 1.65,
              color: 'var(--mantine-color-gray-2)',
            }}
            className="chat-markdown"
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
        )}
      </Box>
    </Box>
  )
}
