import { db } from "./db";

export interface SearchResult {
  id: string;
  content: string;
  documentTitle: string;
  category: string;
  rank: number;
}

const tokenize = (query: string): string[] =>
  query
    .toLowerCase()
    .replace(/[^a-z0-9\sÀ-ſ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map((t) => `${t}:*`);

const runQuery = (tsQuery: string, limit: number) =>
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

export const searchChunks = async (query: string, limit = 6): Promise<SearchResult[]> => {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const results = await runQuery(tokens.join(" & "), limit);

  if (results.length === 0 && tokens.length > 1) {
    return runQuery(tokens.join(" | "), limit);
  }

  return results;
};
