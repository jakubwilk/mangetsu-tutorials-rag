export async function fetchRateLimit(): Promise<number> {
  const response = await fetch('/api/rate-limit')
  if (!response.ok) throw new Error(`${response.status}`)

  const { requestsUsed } = (await response.json()) as { requestsUsed: number }
  return requestsUsed
}
