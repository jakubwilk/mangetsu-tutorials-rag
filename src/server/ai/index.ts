import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OVH_AI_API_KEY,
  baseURL: process.env.OVH_AI_ENDPOINT,
})
