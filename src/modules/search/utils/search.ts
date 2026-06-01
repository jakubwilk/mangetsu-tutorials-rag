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

const merge = (primary: SearchResult[], secondary: SearchResult[], limit: number): SearchResult[] => {
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

export const searchChunks = async (query: string, limit = 3): Promise<SearchResult[]> => {
  const tokens = tokenize(expandWithSynonyms(query));
  if (tokens.length === 0) return [];

  const tsAndQuery = tokens.map((t) => `${t}:*`).join(" & ");
  const tsOrQuery = tokens.map((t) => `${t}:*`).join(" | ");

  const [andResults, trigramResults] = await Promise.all([
    runFts(tsAndQuery, limit).catch(() => [] as SearchResult[]),
    runTrigram(query, limit),
  ]);

  if (andResults.length >= 3) {
    return merge(andResults, trigramResults, limit);
  }

  const orResults = await runFts(tsOrQuery, limit).catch(() => [] as SearchResult[]);
  return merge(orResults, trigramResults, limit);
};
