import type { UserRole } from 'auth'

export async function updateUserRole(
  userId: string,
  role: Exclude<UserRole, 'ROOT'>,
): Promise<{ webhookOk: boolean }> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })

  const json = (await res.json().catch(() => ({}))) as { error?: string; webhookOk?: boolean }

  if (!res.ok) {
    throw new Error(json.error ?? 'Nie udało się zmienić roli.')
  }

  return { webhookOk: json.webhookOk ?? true }
}
