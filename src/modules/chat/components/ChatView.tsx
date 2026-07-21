'use client'

import { Alert, Box, Center, Loader } from '@mantine/core'
import { IconServerOff } from '@tabler/icons-react'
import { notifyError } from 'common/utils'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import {
  ChatRequestError,
  fetchRateLimit,
  sendMessage as sendChatMessage,
  validateSessions,
} from '../api'
import { chatStore } from '../store'
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
        for await (const event of sendChatMessage(text.trim(), activeSessionId)) {
          if (event.type === 'error') {
            notifyError(event.message)
            return
          }

          if (event.type === 'token') {
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
            chatStore.setRequestsUsed(event.requestsUsed)
          }
        }

        chatStore.persistCurrentState()
      } catch (err) {
        if (err instanceof ChatRequestError && err.status === 429) {
          notifyError(err.message)
          chatStore.setRequestsUsed(chatStore.requestLimit)
        } else if (err instanceof ChatRequestError) {
          notifyError(err.message)
        } else {
          notifyError('Błąd połączenia z serwerem. Sprawdź swoje połączenie internetowe.')
        }
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, requestsUsed, activeSessionId],
  )

  useEffect(() => {
    chatStore.init()

    const ids = chatStore
      .getSnapshot()
      .sessions.filter((s) => s.messages.length > 0)
      .map((s) => s.id)

    Promise.all([validateSessions(ids), fetchRateLimit()])
      .then(([valid, requestsUsed]) => {
        if (ids.length > 0) chatStore.pruneInvalidSessions(valid)
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
