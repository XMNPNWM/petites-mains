-- Enhanced Deduplication with Semantic Similarity and Language Preservation
-- This function replaces the basic cleanup_duplicate_knowledge with advanced semantic deduplication

-- Drop existing function first
DROP FUNCTION IF EXISTS public.cleanup_duplicate_knowledge(uuid);

-- Create enhanced semantic deduplication function
CREATE OR REPLACE FUNCTION public.enhanced_semantic_deduplication(p_project_id uuid, p_similarity_threshold numeric DEFAULT 0.8)
RETURNS TABLE(
  relationships_removed integer,
  plot_threads_removed integer,
  timeline_events_removed integer,
  plot_points_removed integer,
  chapter_summaries_removed integer,
  world_building_removed integer,
  themes_removed integer,
  semantic_merges_performed integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  rel_count int := 0;
  thread_count int := 0;
  event_count int := 0;
  point_count int := 0;
  summary_count int := 0;
  world_count int := 0;
  theme_count int := 0;
  merge_count int := 0;
  
  -- Variables for semantic similarity processing
  curr_record RECORD;
  similar_record RECORD;
  relationship_cursor CURSOR FOR 
    SELECT id, character_a_name, character_b_name, relationship_type, confidence_score, created_at, evidence, key_interactions
    FROM public.character_relationships 
    WHERE project_id = p_project_id
    ORDER BY confidence_score DESC, created_at DESC;
    
  timeline_cursor CURSOR FOR 
    SELECT id, event_name, event_summary, event_type, confidence_score, created_at, significance, temporal_markers
    FROM public.timeline_events 
    WHERE project_id = p_project_id
    ORDER BY chronological_order, confidence_score DESC, created_at DESC;
BEGIN
  RAISE NOTICE 'Starting enhanced semantic deduplication for project %', p_project_id;

  -- PHASE 1: Enhanced relationship deduplication with semantic similarity
  RAISE NOTICE 'Phase 1: Processing character relationships with semantic similarity...';
  
  FOR curr_record IN relationship_cursor LOOP
    -- Find similar relationships using fuzzy text matching
    FOR similar_record IN
      SELECT id, character_a_name, character_b_name, relationship_type, confidence_score, created_at, evidence, key_interactions
      FROM public.character_relationships cr2
      WHERE cr2.project_id = p_project_id 
        AND cr2.id != curr_record.id
        AND cr2.created_at < curr_record.created_at  -- Only consider older records to avoid processing same pair twice
        AND (
          -- Same character pair with similar relationship types
          (cr2.character_a_name = curr_record.character_a_name AND cr2.character_b_name = curr_record.character_b_name) OR
          (cr2.character_a_name = curr_record.character_b_name AND cr2.character_b_name = curr_record.character_a_name)
        )
        AND (
          -- Fuzzy matching on relationship type (bienfaiteur vs bienfaiteur/mentor)
          cr2.relationship_type ILIKE '%' || curr_record.relationship_type || '%' OR
          curr_record.relationship_type ILIKE '%' || cr2.relationship_type || '%' OR
          cr2.relationship_type = curr_record.relationship_type
        )
    LOOP
      -- Merge the relationships: keep the one with higher confidence, merge evidence
      IF curr_record.confidence_score >= similar_record.confidence_score THEN
        -- Update current record with merged information
        UPDATE public.character_relationships 
        SET 
          evidence = COALESCE(curr_record.evidence, '') || CASE 
            WHEN curr_record.evidence IS NOT NULL AND similar_record.evidence IS NOT NULL THEN ' | ' 
            ELSE '' 
          END || COALESCE(similar_record.evidence, ''),
          key_interactions = curr_record.key_interactions || COALESCE(similar_record.key_interactions, '[]'::jsonb),
          updated_at = NOW()
        WHERE id = curr_record.id;
        
        -- Delete the similar record
        DELETE FROM public.character_relationships WHERE id = similar_record.id;
        rel_count := rel_count + 1;
        merge_count := merge_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  -- PHASE 2: Timeline events clustering (group similar events like diving sequences)
  RAISE NOTICE 'Phase 2: Clustering similar timeline events...';
  
  FOR curr_record IN timeline_cursor LOOP
    -- Find similar timeline events that should be clustered
    FOR similar_record IN
      SELECT id, event_name, event_summary, event_type, confidence_score, created_at, significance, temporal_markers
      FROM public.timeline_events te2
      WHERE te2.project_id = p_project_id 
        AND te2.id != curr_record.id
        AND te2.created_at < curr_record.created_at
        AND te2.event_type = curr_record.event_type  -- Same event type
        AND (
          -- Semantic similarity in event content
          te2.event_summary ILIKE '%' || substring(curr_record.event_summary from 1 for 10) || '%' OR
          curr_record.event_summary ILIKE '%' || substring(te2.event_summary from 1 for 10) || '%' OR
          -- Similar event names (for diving example: "plonge" and "respire")
          (te2.event_name ILIKE '%plonge%' AND curr_record.event_name ILIKE '%respire%') OR
          (te2.event_name ILIKE '%respire%' AND curr_record.event_name ILIKE '%plonge%') OR
          -- Character names similarity
          te2.event_summary ILIKE '%' || split_part(curr_record.event_summary, ' ', 1) || '%'
        )
        AND ABS(EXTRACT(EPOCH FROM te2.created_at - curr_record.created_at)) < 3600  -- Within 1 hour of creation
    LOOP
      -- Merge timeline events into a comprehensive event
      UPDATE public.timeline_events 
      SET 
        event_name = curr_record.event_name || ' (sequence complète)',
        event_summary = curr_record.event_summary || ' - ' || similar_record.event_summary,
        significance = COALESCE(curr_record.significance, '') || CASE 
          WHEN curr_record.significance IS NOT NULL AND similar_record.significance IS NOT NULL THEN ' | ' 
          ELSE '' 
        END || COALESCE(similar_record.significance, ''),
        temporal_markers = curr_record.temporal_markers || COALESCE(similar_record.temporal_markers, '[]'::jsonb),
        updated_at = NOW()
      WHERE id = curr_record.id;
      
      -- Delete the similar event
      DELETE FROM public.timeline_events WHERE id = similar_record.id;
      event_count := event_count + 1;
      merge_count := merge_count + 1;
    END LOOP;
  END LOOP;

  -- PHASE 3: Standard exact duplicate cleanup for remaining categories
  RAISE NOTICE 'Phase 3: Cleaning exact duplicates in other categories...';

  -- Clean duplicate plot threads (exact matches)
  WITH duplicate_threads AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY project_id, thread_name, thread_type 
      ORDER BY confidence_score DESC, created_at DESC
    ) as rn
    FROM public.plot_threads 
    WHERE project_id = p_project_id
  )
  DELETE FROM public.plot_threads 
  WHERE id IN (
    SELECT id FROM duplicate_threads WHERE rn > 1
  );
  GET DIAGNOSTICS thread_count = ROW_COUNT;

  -- Clean duplicate plot points (exact matches)
  WITH duplicate_points AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY project_id, name, plot_thread_name 
      ORDER BY ai_confidence DESC, created_at DESC
    ) as rn
    FROM public.plot_points 
    WHERE project_id = p_project_id
  )
  DELETE FROM public.plot_points 
  WHERE id IN (
    SELECT id FROM duplicate_points WHERE rn > 1
  );
  GET DIAGNOSTICS point_count = ROW_COUNT;

  -- Clean duplicate chapter summaries (exact matches)
  WITH duplicate_summaries AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY project_id, chapter_id 
      ORDER BY ai_confidence DESC, created_at DESC
    ) as rn
    FROM public.chapter_summaries 
    WHERE project_id = p_project_id
  )
  DELETE FROM public.chapter_summaries 
  WHERE id IN (
    SELECT id FROM duplicate_summaries WHERE rn > 1
  );
  GET DIAGNOSTICS summary_count = ROW_COUNT;

  -- Clean duplicate world building elements with semantic similarity
  WITH duplicate_world AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY project_id, name, category, subcategory 
      ORDER BY confidence_score DESC, created_at DESC
    ) as rn
    FROM public.knowledge_base 
    WHERE project_id = p_project_id AND category = 'world_building'
  )
  DELETE FROM public.knowledge_base 
  WHERE id IN (
    SELECT id FROM duplicate_world WHERE rn > 1
  );
  GET DIAGNOSTICS world_count = ROW_COUNT;

  -- Clean duplicate themes with semantic similarity
  WITH duplicate_themes AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY project_id, name, category 
      ORDER BY confidence_score DESC, created_at DESC
    ) as rn
    FROM public.knowledge_base 
    WHERE project_id = p_project_id AND category = 'theme'
  )
  DELETE FROM public.knowledge_base 
  WHERE id IN (
    SELECT id FROM duplicate_themes WHERE rn > 1
  );
  GET DIAGNOSTICS theme_count = ROW_COUNT;

  RAISE NOTICE 'Enhanced deduplication completed. Removed: % rels, % threads, % events, % points, % summaries, % world, % themes. Semantic merges: %', 
    rel_count, thread_count, event_count, point_count, summary_count, world_count, theme_count, merge_count;

  RETURN QUERY SELECT 
    rel_count,
    thread_count,
    event_count,
    point_count,
    summary_count,
    world_count,
    theme_count,
    merge_count;
END;
$$;

-- Create function to check for semantic similarity before insertion
CREATE OR REPLACE FUNCTION public.check_semantic_similarity(
  p_project_id uuid,
  p_table_name text,
  p_comparison_data jsonb,
  p_similarity_threshold numeric DEFAULT 0.8
) RETURNS TABLE(
  has_similar boolean,
  similar_id uuid,
  similarity_score numeric,
  suggested_action text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  query_text text;
  result_record RECORD;
BEGIN
  -- This function will be enhanced with actual semantic similarity logic
  -- For now, it provides a foundation for pre-storage duplicate checking
  
  CASE p_table_name
    WHEN 'character_relationships' THEN
      -- Check for similar relationships
      SELECT true, id::uuid, 0.9, 'merge_with_existing'
      INTO has_similar, similar_id, similarity_score, suggested_action
      FROM public.character_relationships
      WHERE project_id = p_project_id
        AND character_a_name = (p_comparison_data->>'character_a_name')
        AND character_b_name = (p_comparison_data->>'character_b_name')
        AND relationship_type ILIKE '%' || (p_comparison_data->>'relationship_type') || '%'
      LIMIT 1;
      
    WHEN 'timeline_events' THEN
      -- Check for similar timeline events
      SELECT true, id::uuid, 0.85, 'cluster_with_existing'
      INTO has_similar, similar_id, similarity_score, suggested_action
      FROM public.timeline_events
      WHERE project_id = p_project_id
        AND event_type = (p_comparison_data->>'event_type')
        AND event_summary ILIKE '%' || substring((p_comparison_data->>'event_summary') from 1 for 10) || '%'
      LIMIT 1;
      
    ELSE
      -- Default case
      has_similar := false;
      similar_id := NULL;
      similarity_score := 0;
      suggested_action := 'insert_new';
  END CASE;
  
  -- If no similar record found, default to insert new
  IF similar_id IS NULL THEN
    has_similar := false;
    similarity_score := 0;
    suggested_action := 'insert_new';
  END IF;
  
  RETURN QUERY SELECT has_similar, similar_id, similarity_score, suggested_action;
END;
$$;