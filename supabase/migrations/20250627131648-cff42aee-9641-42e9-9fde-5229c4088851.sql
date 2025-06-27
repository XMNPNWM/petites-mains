
-- Update semantic_chunks table to use Google's text-embedding-004 dimensions (768 instead of 1536)
ALTER TABLE public.semantic_chunks 
ALTER COLUMN embeddings TYPE VECTOR(768);

-- Drop the old index and create new one with updated dimensions
DROP INDEX IF EXISTS idx_semantic_chunks_embeddings;
CREATE INDEX idx_semantic_chunks_embeddings ON public.semantic_chunks 
USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);

-- Create RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_semantic_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  chunk_index int,
  chapter_id uuid,
  project_id uuid
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    sc.id,
    sc.content,
    1 - (sc.embeddings <=> query_embedding) as similarity,
    sc.chunk_index,
    sc.chapter_id,
    sc.project_id
  FROM semantic_chunks sc
  WHERE 
    sc.embeddings IS NOT NULL
    AND (filter_project_id IS NULL OR sc.project_id = filter_project_id)
    AND 1 - (sc.embeddings <=> query_embedding) > match_threshold
  ORDER BY sc.embeddings <=> query_embedding
  LIMIT match_count;
$$;

-- Create RPC function for knowledge extraction workflows
CREATE OR REPLACE FUNCTION extract_knowledge_from_chunks(
  p_project_id uuid,
  p_chapter_id uuid DEFAULT NULL
)
RETURNS TABLE (
  chunks_processed int,
  knowledge_extracted int,
  processing_time interval
)
LANGUAGE plpgsql
AS $$
DECLARE
  start_time timestamp := now();
  chunk_count int := 0;
  knowledge_count int := 0;
BEGIN
  -- Count chunks to process
  SELECT COUNT(*) INTO chunk_count
  FROM semantic_chunks 
  WHERE project_id = p_project_id
    AND (p_chapter_id IS NULL OR chapter_id = p_chapter_id);
  
  -- This will be populated by the actual extraction logic
  knowledge_count := 0;
  
  RETURN QUERY SELECT 
    chunk_count,
    knowledge_count,
    now() - start_time;
END;
$$;

-- Create RPC function for cross-chapter consistency checking
CREATE OR REPLACE FUNCTION check_cross_chapter_consistency(
  p_project_id uuid
)
RETURNS TABLE (
  inconsistencies_found int,
  characters_checked int,
  relationships_checked int,
  plot_threads_checked int
)
LANGUAGE plpgsql
AS $$
DECLARE
  inconsistency_count int := 0;
  char_count int := 0;
  rel_count int := 0;
  plot_count int := 0;
BEGIN
  -- Count characters
  SELECT COUNT(*) INTO char_count
  FROM knowledge_base 
  WHERE project_id = p_project_id AND category = 'character';
  
  -- Count relationships
  SELECT COUNT(*) INTO rel_count
  FROM character_relationships 
  WHERE project_id = p_project_id;
  
  -- Count plot threads
  SELECT COUNT(*) INTO plot_count
  FROM plot_threads 
  WHERE project_id = p_project_id;
  
  -- Placeholder for consistency checking logic
  inconsistency_count := 0;
  
  RETURN QUERY SELECT 
    inconsistency_count,
    char_count,
    rel_count,
    plot_count;
END;
$$;

-- Create RPC function for updating knowledge confidence scores
CREATE OR REPLACE FUNCTION update_knowledge_confidence_scores(
  p_project_id uuid
)
RETURNS TABLE (
  knowledge_updated int,
  avg_confidence_before numeric,
  avg_confidence_after numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count int := 0;
  conf_before numeric := 0;
  conf_after numeric := 0;
BEGIN
  -- Get average confidence before
  SELECT COALESCE(AVG(confidence_score), 0) INTO conf_before
  FROM knowledge_base 
  WHERE project_id = p_project_id;
  
  -- Update confidence scores based on cross-validation
  -- This is a placeholder - actual logic will be implemented in the AI service
  UPDATE knowledge_base 
  SET confidence_score = LEAST(1.0, confidence_score + 0.1)
  WHERE project_id = p_project_id 
    AND confidence_score < 0.9;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Get average confidence after
  SELECT COALESCE(AVG(confidence_score), 0) INTO conf_after
  FROM knowledge_base 
  WHERE project_id = p_project_id;
  
  RETURN QUERY SELECT 
    updated_count,
    conf_before,
    conf_after;
END;
$$;
