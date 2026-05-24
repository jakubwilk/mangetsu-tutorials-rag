'use client'

import { Box, Center, Loader } from '@mantine/core'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { notifyError } from '@/lib/notifications'
import { chatStore } from '@/store'

import ChatInput from './ChatInput'
import MessageList from './MessageList'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatView() {
  const { sessions, activeSessionId, requestsUsed } = useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getSnapshot,
    chatStore.getServerSnapshot
  )

  const [isValidating, setIsValidating] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const messages = activeSession?.messages ?? []

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || requestsUsed >= chatStore.requestLimit) return

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text.trim(),
      }

      chatStore.addMessage(userMessage)
      setIsLoading(true)

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim(), sessionId: activeSessionId }),
        })

        const data: { reply?: string; requestsUsed?: number; error?: string } =
          await response.json()

        if (!response.ok) {
          if (response.status === 429) {
            notifyError(data.error ?? 'Przekroczono dzienny limit zapytań. Spróbuj ponownie jutro.')
            chatStore.setRequestsUsed(chatStore.requestLimit)
          } else {
            notifyError(data.error ?? 'Błąd serwera. Spróbuj ponownie.')
          }
          return
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.reply ?? '',
        }

        chatStore.addMessage(assistantMessage)
        chatStore.setRequestsUsed(data.requestsUsed ?? requestsUsed)
      } catch {
        notifyError('Błąd połączenia z serwerem. Sprawdź swoje połączenie internetowe.')
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, requestsUsed, activeSessionId]
  )

  useEffect(() => {
    chatStore.init()

    const sessionsWithMessages = chatStore.getSnapshot().sessions.filter(
      (s) => s.messages.length > 0
    )
    const ids = sessionsWithMessages.map((s) => s.id).join(',')

    Promise.all([
      ids
        ? fetch(`/api/sessions?ids=${ids}`).then<{ valid: string[] }>((r) => r.json())
        : Promise.resolve({ valid: [] }),
      fetch('/api/rate-limit').then<{ requestsUsed: number }>((r) => r.json()),
    ])
      .then(([{ valid }, { requestsUsed }]) => {
        if (ids) chatStore.pruneInvalidSessions(valid)
        chatStore.setRequestsUsed(requestsUsed)
      })
      .catch(() => {})
      .finally(() => setIsValidating(false))
  }, [])

  if (isValidating) {
    return (
      <Center className="h-full">
        <Loader size="sm" />
      </Center>
    )
  }

  return (
    <Box className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading || requestsUsed >= chatStore.requestLimit}
      />
    </Box>
  )
}
