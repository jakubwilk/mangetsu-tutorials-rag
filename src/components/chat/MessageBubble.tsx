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
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ animation: 'bubble-in 250ms ease' }}
    >
      <Box
        className="max-w-[75%] py-2.5 px-3.5"
        style={{
          borderRadius: isUser
            ? 'var(--mantine-radius-lg) var(--mantine-radius-lg) var(--mantine-radius-xs) var(--mantine-radius-lg)'
            : 'var(--mantine-radius-lg) var(--mantine-radius-lg) var(--mantine-radius-lg) var(--mantine-radius-xs)',
          background: isUser
            ? 'var(--mantine-color-mangetsu-7)'
            : 'var(--mantine-color-dark-6)',
        }}
      >
        {isUser ? (
          <Text size="sm" c="white" className="whitespace-pre-wrap">
            {message.content}
          </Text>
        ) : (
          <Box
            className="chat-markdown leading-[1.65]"
            style={{
              fontSize: 'var(--mantine-font-size-sm)',
              color: 'var(--mantine-color-gray-2)',
            }}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
        )}
      </Box>
    </Box>
  )
}
