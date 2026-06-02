-- DropIndex
DROP INDEX "chunks_content_trgm_idx";

-- DropIndex
DROP INDEX "chunks_embedding_hnsw_idx";

-- Resize embedding column from vector(1024) to vector(4096)
ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(4096);

-- Recreate trigram index
CREATE INDEX IF NOT EXISTS chunks_content_trgm_idx ON chunks USING GIN (content gin_trgm_ops);

-- Note: HNSW index is not created for vector(4096) — pgvector supports HNSW only up to 2000 dims.
-- At current scale (~100-200 chunks), sequential KNN scan is faster than indexed search anyway.
