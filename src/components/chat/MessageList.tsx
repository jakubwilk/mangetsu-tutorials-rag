'use client'

import { Box, Center, ScrollArea, Text } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'

import loadingMessages from '@/data/loading-messages.json'

import type { Message } from './ChatView'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

function BookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      style={{
        color: 'var(--mantine-color-mangetsu-5)',
        animation: 'icon-pulse 1.6s ease-in-out infinite',
      }}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function TypingIndicator() {
  const [text] = useState(
    () => loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  )

  return (
    <Box className="flex justify-start">
      <Box
        className="flex gap-2 items-center py-2.5 px-4"
        style={{
          background: 'var(--mantine-color-dark-6)',
          borderRadius:
            'var(--mantine-radius-lg) var(--mantine-radius-lg) var(--mantine-radius-lg) var(--mantine-radius-xs)',
        }}
      >
        <BookIcon />
        <Text size="sm" c="dimmed" className="italic">
          {text}
        </Text>
      </Box>
    </Box>
  )
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <Center className="flex-1">
        <Box ta="center" px="xl">
          <Text size="xl" fw={300} c="dimmed" mb="xs">
            Zadaj pytanie o poradniki
          </Text>
          <Text size="sm" c="dimmed">
            Wpisz pytanie poniżej i naciśnij Enter
          </Text>
        </Box>
      </Center>
    )
  }

  return (
    <ScrollArea className="flex-1" viewportRef={viewportRef}>
      <Box p="md" className="flex flex-col gap-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
      </Box>
    </ScrollArea>
  )
}
