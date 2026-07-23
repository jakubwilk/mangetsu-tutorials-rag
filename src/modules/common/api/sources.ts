export type SourceMethod = 'URL' | 'CONTENT'

export const submitSource = async (method: SourceMethod, data: string): Promise<string> => {
  const res = await fetch('/api/sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, data }),
  })

  const json = (await res.json()) as { message?: string; error?: string }

  if (!res.ok) throw new Error(json.error ?? 'Nie udało się dodać źródła.')

  return json.message ?? ''
}
