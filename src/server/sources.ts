const WEBHOOK_URL =
  'https://www.ai-automation.underwolfstudio.com/api/v1/webhooks/jIDUu3uWqUE6Dudvk0IkR/sync'

export type SourceMethod = 'URL' | 'CONTENT'

export async function submitSourceToWebhook(method: SourceMethod, data: string): Promise<string> {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, data }),
  })

  const json = (await res.json()) as { status: number; message: string }

  if (!res.ok) throw new Error(json.message)

  return json.message
}
