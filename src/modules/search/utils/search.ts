import { embedText } from 'server/ai/embeddings'
import { db } from 'server/db'

import type { SearchResult } from '../types'

// Maps user-facing terms to canonical stems used in the tutorials.
// Only covers confirmed mismatches between how players write and how rules are written.
// Each entry appends the canonical stem — original tokens are preserved unchanged.
const SYNONYM_RULES: { pattern: RegExp; stem: string }[] = [
  // "posty/post/postów/postami" → "kolejk" (rules use "kolejki/kolejek")
  { pattern: /\bpost(a|y|ów|em|ami|ach|owi|cie)?\b/i, stem: 'kolejk' },
  // "tura/tury" → "kolejk" (tura = turn in fight/challenge, rules use "kolejka")
  { pattern: /\b(tura?|tury|turze|turę|turą|turami|turach)\b/i, stem: 'kolejk' },
  // "runda/rundy" → "kolejk" (runda = round, same concept)
  { pattern: /\b(runda?|rundy|rundzie|rundę|rundą|rundami|rundach)\b/i, stem: 'kolejk' },
]

function expandWithSynonyms(query: string): string {
  const toAppend = new Set<string>()
  for (const { pattern, stem } of SYNONYM_RULES) {
    if (pattern.test(query)) toAppend.add(stem)
  }
  return toAppend.size > 0 ? `${query} ${[...toAppend].join(' ')}` : query
}

const tokenize = (query: string): string[] =>
  query
    .toLowerCase()
    .replace(/[^a-z0-9\sÀ-ſ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)

const runFts = (tsQuery: string, limit: number) =>
  db.$queryRaw<SearchResult[]>`
    SELECT
      c.id,
      c.content,
      d.title AS "documentTitle",
      d.category,
      ts_rank(c.search_vector, to_tsquery('pg_catalog.simple', ${tsQuery})) AS rank
    FROM chunks c
    JOIN documents d ON c."documentId" = d.id
    WHERE c.search_vector @@ to_tsquery('pg_catalog.simple', ${tsQuery})
    ORDER BY rank DESC
    LIMIT ${limit}
  `

const runTrigram = (query: string, limit: number) =>
  db.$queryRaw<SearchResult[]>`
    SELECT
      c.id,
      c.content,
      d.title AS "documentTitle",
      d.category,
      word_similarity(${query}, c.content)::float AS rank
    FROM chunks c
    JOIN documents d ON c."documentId" = d.id
    WHERE word_similarity(${query}, c.content) > 0.1
    ORDER BY rank DESC
    LIMIT ${limit}
  `

const runEmbedding = (embedding: number[], limit: number) => {
  const vector = `[${embedding.join(',')}]`
  return db.$queryRaw<SearchResult[]>`
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
    LIMIT ${limit}
  `
}

// Combines two ranked result lists using Reciprocal Rank Fusion.
// RRF avoids score normalization issues when merging FTS and embedding ranks.
const mergeFts = (
  primary: SearchResult[],
  secondary: SearchResult[],
  limit: number,
): SearchResult[] => {
  const byId = new Map<string, SearchResult & { rank: number }>()

  for (const r of primary) {
    byId.set(r.id, { ...r, rank: Number(r.rank) })
  }
  for (const r of secondary) {
    const rank = Number(r.rank)
    const existing = byId.get(r.id)
    if (existing) {
      existing.rank += rank * 0.5
    } else {
      byId.set(r.id, { ...r, rank })
    }
  }

  return [...byId.values()].sort((a, b) => b.rank - a.rank).slice(0, limit)
}

const mergeHybrid = (
  fts: SearchResult[],
  embedding: SearchResult[],
  limit: number,
): SearchResult[] => {
  const k = 60
  const scores = new Map<string, { result: SearchResult; score: number }>()

  fts.forEach((r, i) => {
    scores.set(r.id, { result: r, score: 1 / (k + i + 1) })
  })

  // Embeddings get 2× weight: for Polish RPG content, semantic similarity is more reliable
  // than keyword matching — user query words rarely appear verbatim in document text.
  embedding.forEach((r, i) => {
    const rrfScore = 2 / (k + i + 1)
    const entry = scores.get(r.id)
    if (entry) {
      entry.score += rrfScore
    } else {
      scores.set(r.id, { result: r, score: rrfScore })
    }
  })

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ result }) => result)
}

// After the hybrid merge, append the next sequential chunks for documents that appear
// more than once in the results. A repeated document means the whole document is relevant
// (e.g. both chunk[0] and chunk[2] of Poziomy Klatw rank in the top 5 → expand to also
// include chunk[1]). Single-appearance documents are tangential hits and are not expanded,
// which avoids inflating the prompt with irrelevant adjacent chunks.
const expandWithNextChunks = async (results: SearchResult[]): Promise<SearchResult[]> => {
  if (results.length === 0) return results

  const resultIds = results.map((r) => r.id)

  const meta = await db.chunk.findMany({
    where: { id: { in: resultIds } },
    select: { id: true, documentId: true, chunkIndex: true },
  })

  const docCount = new Map<string, number>()
  for (const m of meta) docCount.set(m.documentId, (docCount.get(m.documentId) ?? 0) + 1)

  const expandMeta = meta.filter((m) => (docCount.get(m.documentId) ?? 0) > 1)
  if (expandMeta.length === 0) return results

  const nextChunks = await db.chunk.findMany({
    where: {
      OR: expandMeta.flatMap((m) => [
        { documentId: m.documentId, chunkIndex: m.chunkIndex + 1 },
        { documentId: m.documentId, chunkIndex: m.chunkIndex + 2 },
      ]),
      id: { notIn: resultIds },
    },
    select: {
      id: true,
      content: true,
      document: { select: { title: true, category: true } },
    },
  })

  const expanded: SearchResult[] = nextChunks.map((c) => ({
    id: c.id,
    content: c.content,
    documentTitle: c.document.title,
    category: c.document.category,
    rank: 0,
  }))

  return [...results, ...expanded]
}

export const searchChunks = async (query: string, limit = 5): Promise<SearchResult[]> => {
  const tokens = tokenize(expandWithSynonyms(query))
  if (tokens.length === 0) return []

  // Fetch more candidates than needed so RRF can boost chunks appearing in multiple sources.
  // Without this, a relevant chunk that ranks 4th in FTS and 1st in embedding never surfaces
  // when both lists are independently capped at `limit`.
  const fetchLimit = limit * 3

  // Strip 2-char Polish stopwords (na, do, ze, są…) from FTS tokens to reduce noise.
  // These match nearly every chunk and push relevant results out of the top-N window.
  // Fall back to all tokens when nothing longer is available (e.g. "co to PD").
  const specificTokens = tokens.filter((t) => t.length > 2)
  const ftsTokens = specificTokens.length > 0 ? specificTokens : tokens

  const tsAndQuery = ftsTokens.map((t) => `${t}:*`).join(' & ')
  const tsOrQuery = ftsTokens.map((t) => `${t}:*`).join(' | ')

  // FTS (AND), trigram, and embedding run in parallel.
  // Embedding is capped at 8 s — OVH cold-start can be slow and FTS+context expansion
  // provides an acceptable fallback.
  const embeddingTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
  const [andResults, trigramResults, queryEmbedding] = await Promise.all([
    runFts(tsAndQuery, fetchLimit).catch(() => [] as SearchResult[]),
    runTrigram(query, fetchLimit),
    Promise.race([embedText(query).catch(() => null), embeddingTimeout]),
  ])

  // Resolve FTS results (OR fallback if AND returned too few)
  let ftsResults: SearchResult[]
  if (andResults.length >= limit) {
    ftsResults = mergeFts(andResults, trigramResults, fetchLimit)
  } else {
    const orResults = await runFts(tsOrQuery, fetchLimit).catch(() => [] as SearchResult[])
    ftsResults = mergeFts(orResults, trigramResults, fetchLimit)
  }

  // If embedding timed out or failed, fall back to FTS + context expansion
  if (!queryEmbedding) return expandWithNextChunks(ftsResults.slice(0, limit))

  const embeddingResults = await runEmbedding(queryEmbedding, fetchLimit).catch(
    () => [] as SearchResult[],
  )

  const merged = mergeHybrid(ftsResults, embeddingResults, limit)
  return expandWithNextChunks(merged)
}
