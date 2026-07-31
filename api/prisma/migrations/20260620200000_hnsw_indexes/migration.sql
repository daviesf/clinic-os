-- Create HNSW index for SemanticMemory
CREATE INDEX IF NOT EXISTS "SemanticMemory_embedding_idx" ON "SemanticMemory" USING hnsw (embedding vector_cosine_ops);

-- Create HNSW index for EpisodicMemory
CREATE INDEX IF NOT EXISTS "EpisodicMemory_embedding_idx" ON "EpisodicMemory" USING hnsw (embedding vector_cosine_ops);
