import { embedText } from "@/server/ai/embeddings";
import { db } from "@/server/db";

import type { SearchResult } from "../types";

// Maps user-facing terms to canonical stems used in the tutorials.
// Only covers confirmed mismatches between how players write and how rules are written.
// Each entry appends the canonical stem — original tokens are preserved unchanged.
const SYNONYM_RULES: { pattern: RegExp; stem: string }[] = [
  // "posty/post/postów/postami" → "kolejk" (rules use "kolejki/kolejek")
  { pattern: /\bpost(a|y|ów|em|ami|ach|owi|cie)?\b/i, stem: "kolejk" },
  // "tura/tury" → "kolejk" (tura = turn in fight/challenge, rules use "kolejka")
  { pattern: /\b(tura?|tury|turze|turę|turą|turami|turach)\b/i, stem: "kolejk" },
  // "runda/rundy" → "kolejk" (runda = round, same concept)
  { pattern: /\b(runda?|rundy|rundzie|rundę|rundą|rundami|rundach)\b/i, stem: "kolejk" },
];

function expandWithSynonyms(query: string): string {
  const toAppend = new Set<string>();
  for (const { pattern, stem } of SYNONYM_RULES) {
    if (pattern.test(query)) toAppend.add(stem);
  }
  return toAppend.size > 0 ? `${query} ${[...toAppend].join(" ")}` : query;
}

const tokenize = (query: string): string[] =>
  query
    .toLowerCase()
    .replace(/[^a-z0-9\sÀ-ſ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

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
  `;

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
  `;

const runEmbedding = (embedding: number[], limit: number) => {
  const vector = `[${embedding.join(",")}]`;
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
  `;
};

// Combines two ranked result lists using Reciprocal Rank Fusion.
// RRF avoids score normalization issues when merging FTS and embedding ranks.
const mergeFts = (primary: SearchResult[], secondary: SearchResult[], limit: number): SearchResult[] => {
  const byId = new Map<string, SearchResult & { rank: number }>();

  for (const r of primary) {
    byId.set(r.id, { ...r, rank: Number(r.rank) });
  }
  for (const r of secondary) {
    const rank = Number(r.rank);
    const existing = byId.get(r.id);
    if (existing) {
      existing.rank += rank * 0.5;
    } else {
      byId.set(r.id, { ...r, rank });
    }
  }

  return [...byId.values()]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit);
};

const mergeHybrid = (
  fts: SearchResult[],
  embedding: SearchResult[],
  limit: number
): SearchResult[] => {
  const k = 60;
  const scores = new Map<string, { result: SearchResult; score: number }>();

  fts.forEach((r, i) => {
    scores.set(r.id, { result: r, score: 1 / (k + i + 1) });
  });

  embedding.forEach((r, i) => {
    const rrfScore = 1 / (k + i + 1);
    const entry = scores.get(r.id);
    if (entry) {
      entry.score += rrfScore;
    } else {
      scores.set(r.id, { result: r, score: rrfScore });
    }
  });

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ result }) => result);
};

export const searchChunks = async (query: string, limit = 3): Promise<SearchResult[]> => {
  const tokens = tokenize(expandWithSynonyms(query));
  if (tokens.length === 0) return [];

  const tsAndQuery = tokens.map((t) => `${t}:*`).join(" & ");
  const tsOrQuery = tokens.map((t) => `${t}:*`).join(" | ");

  // FTS (AND), trigram, and embedding run in parallel
  const [andResults, trigramResults, queryEmbedding] = await Promise.all([
    runFts(tsAndQuery, limit).catch(() => [] as SearchResult[]),
    runTrigram(query, limit),
    embedText(query).catch(() => null),
  ]);

  // Resolve FTS results (OR fallback if AND returned too few)
  let ftsResults: SearchResult[];
  if (andResults.length >= 3) {
    ftsResults = mergeFts(andResults, trigramResults, limit);
  } else {
    const orResults = await runFts(tsOrQuery, limit).catch(() => [] as SearchResult[]);
    ftsResults = mergeFts(orResults, trigramResults, limit);
  }

  // If embedding call failed, fall back to FTS-only
  if (!queryEmbedding) return ftsResults;

  const embeddingResults = await runEmbedding(queryEmbedding, limit).catch(() => [] as SearchResult[]);

  return mergeHybrid(ftsResults, embeddingResults, limit);
};
