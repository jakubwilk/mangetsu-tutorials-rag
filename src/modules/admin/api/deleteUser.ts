export async function deleteUser(userId: string, notify: boolean): Promise<{ webhookOk: boolean }> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notify }),
  })

  const json = (await res.json().catch(() => ({}))) as { error?: string; webhookOk?: boolean }

  if (!res.ok) {
    throw new Error(json.error ?? 'Nie udało się usunąć użytkownika.')
  }

  return { webhookOk: json.webhookOk ?? true }
}
