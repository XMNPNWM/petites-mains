-- Add function to clean up duplicate entries based on project analysis
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_knowledge(p_project_id uuid)
RETURNS TABLE(
  relationships_removed integer,
  plot_threads_removed integer,
  timeline_events_removed integer,
  plot_points_removed integer,
  chapter_summaries_removed integer,
  world_building_removed integer,
  themes_removed integer
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
BEGIN
  -- Clean duplicate character relationships (keep most recent with highest confidence)
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

  -- Clean duplicate plot threads (keep most recent with highest confidence)
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

  -- Clean duplicate timeline events (keep most recent with highest confidence)
  WITH duplicate_events AS (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY project_id, event_name, event_type 
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

  -- Clean duplicate plot points (keep most recent with highest confidence)
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

  -- Clean duplicate chapter summaries (keep most recent with highest confidence)
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

  -- Clean duplicate world building elements in knowledge_base (keep most recent with highest confidence)
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

  -- Clean duplicate themes in knowledge_base (keep most recent with highest confidence)
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

  RETURN QUERY SELECT 
    rel_count,
    thread_count,
    event_count,
    point_count,
    summary_count,
    world_count,
    theme_count;
END;
$$;