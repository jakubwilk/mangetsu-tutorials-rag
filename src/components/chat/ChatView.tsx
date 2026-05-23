'use client'

import { Box } from '@mantine/core'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { chatStore } from '@/store'

import ChatInput from './ChatInput'
import MessageList from './MessageList'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const MOCK_RESPONSES = [
  'To jest przykładowa odpowiedź asystenta. W pełnej wersji odpowiedź będzie generowana przez model językowy na podstawie poradników z forum Mangetsu.',
  'Znalazłem kilka pasujących fragmentów w bazie wiedzy. Oto co mogę Ci powiedzieć na ten temat — na razie to tylko **mock**, docelowo odpowiedź przyjdzie z API `/api/chat`.',
  'Niestety nie znalazłem informacji na ten temat w dostępnych poradnikach. Spróbuj przeformułować pytanie lub sprawdź sekcję **Poradniki dla początkujących**.',
]

export default function ChatView() {
  const { sessions, activeSessionId, requestsUsed } = useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getSnapshot,
    chatStore.getServerSnapshot
  )

  useEffect(() => {
    chatStore.init()
  }, [])

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
      chatStore.incrementRequests()
      setIsLoading(true)

      await new Promise<void>((resolve) => setTimeout(resolve, 1200))

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)],
      }

      chatStore.addMessage(assistantMessage)
      setIsLoading(false)
    },
    [isLoading, requestsUsed]
  )

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
