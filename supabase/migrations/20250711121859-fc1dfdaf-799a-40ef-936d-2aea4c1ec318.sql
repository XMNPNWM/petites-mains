-- Disable the overly aggressive enhanced_semantic_deduplication function
-- and replace it with a conservative version that only removes exact duplicates

DROP FUNCTION IF EXISTS public.enhanced_semantic_deduplication(uuid, numeric);

-- Create a conservative deduplication function that only removes exact duplicates
CREATE OR REPLACE FUNCTION public.conservative_deduplication(p_project_id uuid)
 RETURNS TABLE(relationships_removed integer, plot_threads_removed integer, timeline_events_removed integer, plot_points_removed integer, chapter_summaries_removed integer, world_building_removed integer, themes_removed integer, semantic_merges_performed integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  rel_count int := 0;
  thread_count int := 0;
  event_count int := 0;
  point_count int := 0;
  summary_count int := 0;
  world_count int := 0;
  theme_count int := 0;
  merge_count int := 0;
BEGIN
  RAISE NOTICE 'Starting conservative deduplication for project %', p_project_id;

  -- Only remove EXACT duplicates, not semantic similarities
  
  -- Clean exact duplicate relationships
  WITH duplicate_relationships AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY project_id, character_a_name, character_b_name, relationship_type 
      ORDER BY confidence_score DESC, created_at DESC
    ) as rn
    FROM public.character_relationships 
    WHERE project_id = p_project_id
  )
  DELETE FROM public.character_relationships 
  WHERE id IN (
    SELECT id FROM duplicate_relationships WHERE rn > 1
  );
  GET DIAGNOSTICS rel_count = ROW_COUNT;

  -- Clean exact duplicate timeline events
  WITH duplicate_events AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY project_id, event_name, event_type, chronological_order
      ORDER BY confidence_score DESC, created_at DESC
    ) as rn
    FROM public.timeline_events 
    WHERE project_id = p_project_id
  )
  DELETE FROM public.timeline_events 
  WHERE id IN (
    SELECT id FROM duplicate_events WHERE rn > 1
  );
  GET DIAGNOSTICS event_count = ROW_COUNT;

  -- Clean exact duplicate plot threads
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

  -- Clean exact duplicate plot points
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

  -- Clean exact duplicate chapter summaries
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

  -- Clean exact duplicate world building elements
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

  -- Clean exact duplicate themes
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

  RAISE NOTICE 'Conservative deduplication completed. Removed: % rels, % threads, % events, % points, % summaries, % world, % themes', 
    rel_count, thread_count, event_count, point_count, summary_count, world_count, theme_count;

  RETURN QUERY SELECT 
    rel_count,
    thread_count,
    event_count,
    point_count,
    summary_count,
    world_count,
    theme_count,
    0; -- No semantic merges in conservative mode
END;
$function$;