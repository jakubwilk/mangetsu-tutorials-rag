import type { UserRole } from 'auth'

export async function updateUserRole(
  userId: string,
  role: Exclude<UserRole, 'ROOT'>,
): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(json.error ?? 'Nie udało się zmienić roli.')
  }
}
