-- Add missing fields to support enhanced embeddings processing
ALTER TABLE semantic_chunks 
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS embedding_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_embedded_at TIMESTAMP WITH TIME ZONE;

-- Add missing fields to knowledge base tables for user override system
ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS user_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edit_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_ai_value JSONB;

ALTER TABLE character_relationships
ADD COLUMN IF NOT EXISTS user_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edit_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_ai_value JSONB;

ALTER TABLE timeline_events
ADD COLUMN IF NOT EXISTS user_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edit_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_ai_value JSONB;

ALTER TABLE plot_threads
ADD COLUMN IF NOT EXISTS user_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edit_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_ai_value JSONB;

ALTER TABLE plot_points
ADD COLUMN IF NOT EXISTS user_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edit_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_ai_value JSONB;

ALTER TABLE chapter_summaries
ADD COLUMN IF NOT EXISTS user_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edit_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS original_ai_value JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_semantic_chunks_content_hash ON semantic_chunks(content_hash);
CREATE INDEX IF NOT EXISTS idx_semantic_chunks_embedding_status ON semantic_chunks(embedding_status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_edited ON knowledge_base(user_edited);
CREATE INDEX IF NOT EXISTS idx_character_relationships_user_edited ON character_relationships(user_edited);

-- Add enhanced similarity matching function for better performance
CREATE OR REPLACE FUNCTION match_semantic_chunks_enhanced(
  query_embedding vector, 
  match_threshold double precision DEFAULT 0.7, 
  match_count integer DEFAULT 10, 
  filter_project_id uuid DEFAULT NULL::uuid,
  exclude_chapter_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid, 
  content text, 
  similarity double precision, 
  chunk_index integer, 
  chapter_id uuid, 
  project_id uuid,
  content_hash text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    sc.id,
    sc.content,
    1 - (sc.embeddings <=> query_embedding) as similarity,
    sc.chunk_index,
    sc.chapter_id,
    sc.project_id,
    sc.content_hash
  FROM semantic_chunks sc
  WHERE 
    sc.embeddings IS NOT NULL
    AND (filter_project_id IS NULL OR sc.project_id = filter_project_id)
    AND (exclude_chapter_id IS NULL OR sc.chapter_id != exclude_chapter_id)
    AND 1 - (sc.embeddings <=> query_embedding) > match_threshold
  ORDER BY sc.embeddings <=> query_embedding
  LIMIT match_count;
$function$;