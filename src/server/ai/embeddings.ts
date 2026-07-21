import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OVH_AI_API_KEY,
  baseURL: process.env.OVH_AI_EMBEDDING_ENDPOINT,
})

export const embedText = async (text: string): Promise<number[]> => {
  const response = await client.embeddings.create({
    model: process.env.OVH_AI_EMBEDDING_MODEL ?? 'Qwen3-Embedding-8B',
    input: text,
  })
  return response.data[0]!.embedding
}
