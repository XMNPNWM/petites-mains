
-- Fix function search path security issues by setting explicit search_path
-- This prevents potential SQL injection vulnerabilities

-- 1. Fix update_export_config_timestamp function
CREATE OR REPLACE FUNCTION public.update_export_config_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 2. Fix increment_content_version function
CREATE OR REPLACE FUNCTION public.increment_content_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Get the current max version number for this chapter and content type
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO NEW.version_number
  FROM public.content_versions 
  WHERE chapter_id = NEW.chapter_id 
  AND content_type = NEW.content_type;
  
  RETURN NEW;
END;
$function$;

-- 3. Fix update_chapter_version function
CREATE OR REPLACE FUNCTION public.update_chapter_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only increment if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.content_version_number = OLD.content_version_number + 1;
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. Fix calculate_relevance_score function
CREATE OR REPLACE FUNCTION public.calculate_relevance_score(
  category_param knowledge_category,
  description_param TEXT,
  details_param JSONB
) RETURNS NUMERIC 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Higher scores for abilities, powers, key traits
  -- Lower scores for environmental/narrative details
  RETURN CASE category_param
    WHEN 'character' THEN
      CASE 
        WHEN description_param ~* 'pouvoir|capacité|don|magie|communiquer|contrôle|transformation' THEN 0.9
        WHEN description_param ~* 'personnalité|caractère|trait|comportement' THEN 0.7
        WHEN description_param ~* 'apparence|physique|taille|couleur' THEN 0.5
        WHEN description_param ~* 'couchette|lit|chambre|environnement' THEN 0.3
        ELSE 0.6
      END
    WHEN 'world_building' THEN 0.8
    WHEN 'theme' THEN 0.7
    WHEN 'plot_point' THEN 0.8
    ELSE 0.5
  END;
END;
$function$;

-- 5. Create extensions schema and move vector extension for security
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension from public to extensions schema
-- Note: This requires superuser privileges, so it might need to be done via Supabase dashboard
-- ALTER EXTENSION vector SET SCHEMA extensions;

-- Update the match_semantic_chunks functions to explicitly reference public schema
CREATE OR REPLACE FUNCTION public.match_semantic_chunks(
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
LANGUAGE sql 
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sc.id,
    sc.content,
    1 - (sc.embeddings <=> query_embedding) as similarity,
    sc.chunk_index,
    sc.chapter_id,
    sc.project_id
  FROM public.semantic_chunks sc
  WHERE 
    sc.embeddings IS NOT NULL
    AND (filter_project_id IS NULL OR sc.project_id = filter_project_id)
    AND 1 - (sc.embeddings <=> query_embedding) > match_threshold
  ORDER BY sc.embeddings <=> query_embedding
  LIMIT match_count;
$$;

-- Update the enhanced match function as well
CREATE OR REPLACE FUNCTION public.match_semantic_chunks_enhanced(
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
AS $$
  SELECT 
    sc.id,
    sc.content,
    1 - (sc.embeddings <=> query_embedding) as similarity,
    sc.chunk_index,
    sc.chapter_id,
    sc.project_id,
    sc.content_hash
  FROM public.semantic_chunks sc
  WHERE 
    sc.embeddings IS NOT NULL
    AND (filter_project_id IS NULL OR sc.project_id = filter_project_id)
    AND (exclude_chapter_id IS NULL OR sc.chapter_id != exclude_chapter_id)
    AND 1 - (sc.embeddings <=> query_embedding) > match_threshold
  ORDER BY sc.embeddings <=> query_embedding
  LIMIT match_count;
$$;
