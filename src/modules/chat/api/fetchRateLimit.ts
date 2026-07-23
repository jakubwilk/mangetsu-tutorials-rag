export interface RateLimitStatus {
  requestsUsed: number
  limit: number
}

export async function fetchRateLimit(): Promise<RateLimitStatus> {
  const response = await fetch('/api/rate-limit')
  if (!response.ok) throw new Error(`${response.status}`)

  return (await response.json()) as RateLimitStatus
}
