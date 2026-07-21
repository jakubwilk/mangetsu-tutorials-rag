export async function validateSessions(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return []

  const response = await fetch(`/api/sessions?ids=${ids.join(',')}`)
  if (!response.ok) throw new Error(`${response.status}`)

  const { valid } = (await response.json()) as { valid: string[] }
  return valid
}
