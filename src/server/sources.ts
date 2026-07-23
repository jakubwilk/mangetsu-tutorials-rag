export type SourceMethod = 'URL' | 'CONTENT'

export async function submitSourceToWebhook(method: SourceMethod, data: string): Promise<string> {
  const res = await fetch(process.env.SOURCES_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, data }),
  })

  const json = (await res.json()) as { status: number; message: string }

  if (!res.ok) throw new Error(json.message)

  return json.message
}
