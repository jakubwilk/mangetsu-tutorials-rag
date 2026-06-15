'use client'

import { Alert, Box, Center, Loader } from '@mantine/core'
import { IconServerOff } from '@tabler/icons-react'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { notifyError } from 'common/utils/notifications'

import { chatStore } from '../store'
import type { Message } from '../types'
import ChatInput from './ChatInput'
import MessageList from './MessageList'

export default function ChatView() {
  const { sessions, activeSessionId, requestsUsed } = useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getSnapshot,
    chatStore.getServerSnapshot,
  )

  const [isValidating, setIsValidating] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isDbError, setIsDbError] = useState(false)

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const messages = activeSession?.messages ?? []

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || requestsUsed >= chatStore.requestLimit) return

      chatStore.addMessage({ id: crypto.randomUUID(), role: 'user', content: text.trim() })
      setIsLoading(true)

      let assistantMessageId: string | null = null

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim(), sessionId: activeSessionId }),
        })

        if (!response.ok || !response.body) {
          const data = (await response.json().catch(() => ({}))) as { error?: string }
          if (response.status === 429) {
            notifyError(data.error ?? 'Przekroczono dzienny limit zapytań. Spróbuj ponownie jutro.')
            chatStore.setRequestsUsed(chatStore.requestLimit)
          } else {
            notifyError(data.error ?? 'Błąd serwera. Spróbuj ponownie.')
          }
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            if (!part.startsWith('data: ')) continue
            let event: { type: string; content?: string; message?: string; requestsUsed?: number }
            try {
              event = JSON.parse(part.slice(6)) as typeof event
            } catch {
              continue
            }

            if (event.type === 'error') {
              notifyError(event.message ?? 'Błąd serwera. Spróbuj ponownie.')
              return
            }

            if (event.type === 'token' && event.content) {
              if (!assistantMessageId) {
                assistantMessageId = crypto.randomUUID()
                chatStore.addMessage({
                  id: assistantMessageId,
                  role: 'assistant',
                  content: event.content,
                })
                setIsLoading(false)
              } else {
                chatStore.appendToMessage(assistantMessageId, event.content)
              }
            }

            if (event.type === 'done') {
              chatStore.setRequestsUsed(event.requestsUsed ?? requestsUsed)
            }
          }
        }

        chatStore.persistCurrentState()
      } catch {
        notifyError('Błąd połączenia z serwerem. Sprawdź swoje połączenie internetowe.')
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, requestsUsed, activeSessionId],
  )

  useEffect(() => {
    chatStore.init()

    const sessionsWithMessages = chatStore
      .getSnapshot()
      .sessions.filter((s) => s.messages.length > 0)
    const ids = sessionsWithMessages.map((s) => s.id).join(',')

    const fetchJson = async <T,>(url: string): Promise<T> => {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json() as Promise<T>
    }

    Promise.all([
      ids
        ? fetchJson<{ valid: string[] }>(`/api/sessions?ids=${ids}`)
        : Promise.resolve({ valid: [] }),
      fetchJson<{ requestsUsed: number }>('/api/rate-limit'),
    ])
      .then(([{ valid }, { requestsUsed }]) => {
        if (ids) chatStore.pruneInvalidSessions(valid)
        chatStore.setRequestsUsed(requestsUsed)
      })
      .catch(() => setIsDbError(true))
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
    <Box className="flex h-full flex-col">
      <MessageList messages={messages} isLoading={isLoading} />
      {isDbError ? (
        <Alert
          icon={<IconServerOff size={16} />}
          color="red"
          variant="light"
          title="Serwis niedostępny"
          className="m-4"
        >
          Nie można połączyć się z bazą danych. Czat jest tymczasowo wyłączony.
        </Alert>
      ) : (
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading || requestsUsed >= chatStore.requestLimit}
        />
      )}
    </Box>
  )
}
