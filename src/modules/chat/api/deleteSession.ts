export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/sessions?id=${sessionId}`, { method: 'DELETE' })
  if (!response.ok) throw new Error(`${response.status}`)
}
