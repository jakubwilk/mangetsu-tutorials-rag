-- Enable pgvector (required for vector type — must run before AlterTable)
CREATE EXTENSION IF NOT EXISTS vector;

-- DropIndex
DROP INDEX "chunks_content_trgm_idx";

-- AlterTable
ALTER TABLE "chunks" ADD COLUMN "embedding" vector(1024);

-- Recreate trigram index (dropped above because Prisma doesn't track raw indexes)
CREATE INDEX IF NOT EXISTS chunks_content_trgm_idx ON chunks USING GIN (content gin_trgm_ops);

-- Note: HNSW index skipped — added in next migration after dimension resize to vector(4096).
