import type { Message } from '@/components/chat/ChatView'

export interface ChatSession {
  id: string
  messages: Message[]
  createdAt: number
}

const SESSIONS_KEY = 'mangetsu:chat-sessions'
const ACTIVE_KEY = 'mangetsu:active-session'
const REQUESTS_KEY = 'mangetsu:requests-today'

interface RequestsRecord {
  date: string
  count: number
}

interface StoreSnapshot {
  sessions: ChatSession[]
  activeSessionId: string
  requestsUsed: number
}

const REQUEST_LIMIT = 10

const SERVER_SNAPSHOT: StoreSnapshot = {
  sessions: [],
  activeSessionId: '',
  requestsUsed: 0,
}

let snapshot: StoreSnapshot = SERVER_SNAPSHOT

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadFromStorage(): StoreSnapshot {
  try {
    const sessions: ChatSession[] = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]')
    const activeSessionId = localStorage.getItem(ACTIVE_KEY) ?? ''

    const todayStr = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem(REQUESTS_KEY)
    const record: RequestsRecord = raw ? JSON.parse(raw) : { date: todayStr, count: 0 }
    const requestsUsed = record.date === todayStr ? record.count : 0

    return { sessions, activeSessionId, requestsUsed }
  } catch {
    return { sessions: [], activeSessionId: '', requestsUsed: 0 }
  }
}

function createSession(): ChatSession {
  return { id: crypto.randomUUID(), messages: [], createdAt: Date.now() }
}

function persistSessions(sessions: ChatSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

function persistActiveId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id)
}

function persistRequests(count: number) {
  const todayStr = new Date().toISOString().slice(0, 10)
  localStorage.setItem(REQUESTS_KEY, JSON.stringify({ date: todayStr, count }))
}

export const chatStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => void listeners.delete(listener)
  },

  getSnapshot() {
    return snapshot
  },

  getServerSnapshot(): StoreSnapshot {
    return SERVER_SNAPSHOT
  },

  init() {
    snapshot = loadFromStorage()

    if (!snapshot.sessions.find((s) => s.id === snapshot.activeSessionId)) {
      const session = createSession()
      snapshot = {
        ...snapshot,
        sessions: [session, ...snapshot.sessions],
        activeSessionId: session.id,
      }
      persistSessions(snapshot.sessions)
      persistActiveId(session.id)
    }

    notify()
  },

  newSession() {
    const session = createSession()
    snapshot = {
      ...snapshot,
      sessions: [session, ...snapshot.sessions],
      activeSessionId: session.id,
    }
    persistSessions(snapshot.sessions)
    persistActiveId(session.id)
    notify()
  },

  switchSession(id: string) {
    if (!snapshot.sessions.find((s) => s.id === id)) return
    snapshot = { ...snapshot, activeSessionId: id }
    persistActiveId(id)
    notify()
  },

  addMessage(message: Message) {
    const sessions = snapshot.sessions.map((s) =>
      s.id === snapshot.activeSessionId ? { ...s, messages: [...s.messages, message] } : s
    )
    snapshot = { ...snapshot, sessions }
    persistSessions(sessions)
    notify()
  },

  incrementRequests() {
    const count = snapshot.requestsUsed + 1
    snapshot = { ...snapshot, requestsUsed: count }
    persistRequests(count)
    notify()
  },

  setRequestsUsed(count: number) {
    snapshot = { ...snapshot, requestsUsed: count }
    persistRequests(count)
    notify()
  },

  getActiveSession(): ChatSession | undefined {
    return snapshot.sessions.find((s) => s.id === snapshot.activeSessionId)
  },

  get requestLimit() {
    return REQUEST_LIMIT
  },
}
