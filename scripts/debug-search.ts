import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../src/generated/prisma/client'
import { embedText } from '../src/server/ai/embeddings'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

const QUERY = 'Jakie są rodzaje klątw na Mangetsu?'
const K = 60
const LIMIT = 5
const FETCH_LIMIT = LIMIT * 3

type SearchResult = {
  id: string
  content: string
  documentTitle: string
  category: string
  rank: number
}

const main = async () => {
  console.log(`\nQuery: "${QUERY}"\n`)

  // 1. Test embedText
  console.log('=== Step 1: embedText ===')
  let queryEmbedding: number[] | null = null
  try {
    queryEmbedding = await embedText(QUERY)
    console.log(`  OK — dim=${queryEmbedding.length}`)
  } catch (err) {
    console.error('  FAILED:', err instanceof Error ? err.message : err)
  }

  // 2. Embedding search results
  if (queryEmbedding) {
    const vector = `[${queryEmbedding.join(',')}]`
    const embResults = await db.$queryRaw<SearchResult[]>`
      SELECT
        c.id,
        c.content,
        d.title AS "documentTitle",
        d.category,
        (1 - (c.embedding <=> ${vector}::vector))::float AS rank
      FROM chunks c
      JOIN documents d ON c."documentId" = d.id
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${vector}::vector
      LIMIT ${FETCH_LIMIT}
    `
    console.log(`\n=== Step 2: Embedding top ${FETCH_LIMIT} ===`)
    embResults.forEach((r, i) => {
      console.log(
        `  [${i}] sim=${Number(r.rank).toFixed(4)} | ${r.documentTitle} | ${r.content.slice(0, 80).replace(/\n/g, '↵')}...`,
      )
    })

    // 3. FTS with specific tokens (length > 2)
    const tokens = QUERY.toLowerCase()
      .replace(/[^a-z0-9\sÀ-ſ]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1)
    const specific = tokens.filter((t) => t.length > 2)
    const ftsTokens = specific.length > 0 ? specific : tokens
    const orQuery = ftsTokens.map((t) => `${t}:*`).join(' | ')
    console.log(`\n=== Step 3: FTS OR (tokens: [${ftsTokens.join(', ')}]) ===`)
    const ftsResults = await db.$queryRaw<SearchResult[]>`
      SELECT
        c.id,
        c.content,
        d.title AS "documentTitle",
        d.category,
        ts_rank(c.search_vector, to_tsquery('pg_catalog.simple', ${orQuery}))::float AS rank
      FROM chunks c
      JOIN documents d ON c."documentId" = d.id
      WHERE c.search_vector @@ to_tsquery('pg_catalog.simple', ${orQuery})
      ORDER BY rank DESC
      LIMIT ${FETCH_LIMIT}
    `
    ftsResults.forEach((r, i) => {
      console.log(
        `  [${i}] rank=${Number(r.rank).toFixed(4)} | ${r.documentTitle} | ${r.content.slice(0, 80).replace(/\n/g, '↵')}...`,
      )
    })

    // 4. Simulate mergeHybrid with 2× embedding weight
    console.log(`\n=== Step 4: mergeHybrid (emb 2×, limit=${LIMIT}) ===`)
    const scores = new Map<string, { result: SearchResult; score: number }>()
    ftsResults.forEach((r, i) => {
      scores.set(r.id, { result: r, score: 1 / (K + i + 1) })
    })
    embResults.forEach((r, i) => {
      const rrfScore = 2 / (K + i + 1)
      const entry = scores.get(r.id)
      if (entry) {
        entry.score += rrfScore
      } else {
        scores.set(r.id, { result: r, score: rrfScore })
      }
    })
    const merged = [...scores.values()].sort((a, b) => b.score - a.score).slice(0, LIMIT)
    merged.forEach(({ result: r, score }) => {
      console.log(
        `  score=${score.toFixed(5)} | ${r.documentTitle} | ${r.content.slice(0, 80).replace(/\n/g, '↵')}...`,
      )
    })
  }

  await db.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
