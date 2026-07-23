const WEBHOOK_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL

const ROLE_ACTIVATION_WEBHOOK_PATH = 'a5ef7246-402a-4d2c-a083-089e5872436e'
const USER_DELETION_WEBHOOK_PATH = '9fd60ced-e4d4-4fdf-be5d-721e00fb1165'

interface RoleActivationPayload {
  id: string
  name: string | null
  email: string | null
  role: string
}

export async function notifyRoleActivation(payload: RoleActivationPayload): Promise<void> {
  const res = await fetch(`${WEBHOOK_BASE_URL}/${ROLE_ACTIVATION_WEBHOOK_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Webhook aktywacji konta zwrócił status ${res.status}.`)
}

interface UserDeletionPayload {
  id: string
  notify: boolean
  name: string | null
  email: string | null
}

export async function notifyUserDeletion(payload: UserDeletionPayload): Promise<void> {
  const res = await fetch(`${WEBHOOK_BASE_URL}/${USER_DELETION_WEBHOOK_PATH}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Webhook usunięcia konta zwrócił status ${res.status}.`)
}
