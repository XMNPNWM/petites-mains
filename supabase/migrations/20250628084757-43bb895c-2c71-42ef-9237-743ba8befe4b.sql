
-- Fix function search path security issues by adding SECURITY DEFINER SET search_path = ''
-- Note: Vector operators need to remain unqualified for proper resolution

-- Fix handle_new_user_usage function
CREATE OR REPLACE FUNCTION public.handle_new_user_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.usage_tracking (user_id)
  VALUES (new.id);
  RETURN new;
END;
$function$;

-- Fix update_knowledge_timestamp function
CREATE OR REPLACE FUNCTION public.update_knowledge_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix update_project_count function
CREATE OR REPLACE FUNCTION public.update_project_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.usage_tracking (user_id, current_projects)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      current_projects = public.usage_tracking.current_projects + 1,
      updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.usage_tracking
    SET 
      current_projects = GREATEST(0, current_projects - 1),
      updated_at = now()
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix update_project_timestamp function
CREATE OR REPLACE FUNCTION public.update_project_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Update the project's updated_at timestamp when a chapter is modified
  UPDATE public.projects 
  SET updated_at = NOW() 
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix auto_flag_low_confidence function
CREATE OR REPLACE FUNCTION public.auto_flag_low_confidence()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Flag items with confidence < 0.5
  IF NEW.confidence_score < 0.50 THEN
    NEW.is_flagged = TRUE;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix update_worldbuilding_count function
CREATE OR REPLACE FUNCTION public.update_worldbuilding_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  project_user_id UUID;
BEGIN
  -- Get the user_id from the project
  SELECT user_id INTO project_user_id FROM public.projects WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.usage_tracking (user_id, worldbuilding_elements_count)
    VALUES (project_user_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      worldbuilding_elements_count = public.usage_tracking.worldbuilding_elements_count + 1,
      updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.usage_tracking
    SET 
      worldbuilding_elements_count = GREATEST(0, worldbuilding_elements_count - 1),
      updated_at = now()
    WHERE user_id = project_user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix log_knowledge_change function
CREATE OR REPLACE FUNCTION public.log_knowledge_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Log the change
  INSERT INTO public.knowledge_change_log (
    knowledge_base_id,
    change_type,
    field_changed,
    old_value,
    new_value,
    confidence_before,
    confidence_after,
    change_reason
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'addition'::public.change_type
      WHEN TG_OP = 'UPDATE' THEN 'modification'::public.change_type
      WHEN TG_OP = 'DELETE' THEN 'deletion'::public.change_type
    END,
    'knowledge_base_record',
    CASE WHEN TG_OP = 'DELETE' THEN OLD.name ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN NEW.name ELSE NULL END,
    CASE WHEN TG_OP != 'INSERT' THEN OLD.confidence_score ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN NEW.confidence_score ELSE NULL END,
    'Automated change logging'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix update_processing_progress function
CREATE OR REPLACE FUNCTION public.update_processing_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Auto-calculate progress percentage
  IF NEW.total_steps > 0 THEN
    NEW.progress_percentage = LEAST(100, (NEW.completed_steps * 100) / NEW.total_steps);
  END IF;
  
  -- Mark as done if 100% complete
  IF NEW.progress_percentage >= 100 AND NEW.state != 'done' AND NEW.state != 'failed' THEN
    NEW.state = 'done';
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix match_semantic_chunks function (vector operators must remain unqualified)
CREATE OR REPLACE FUNCTION public.match_semantic_chunks(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10, filter_project_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, content text, similarity double precision, chunk_index integer, chapter_id uuid, project_id uuid)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER SET search_path = 'public'
AS $function$
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
$function$;

-- Fix extract_knowledge_from_chunks function
CREATE OR REPLACE FUNCTION public.extract_knowledge_from_chunks(p_project_id uuid, p_chapter_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(chunks_processed integer, knowledge_extracted integer, processing_time interval)
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  start_time timestamp := now();
  chunk_count int := 0;
  knowledge_count int := 0;
BEGIN
  -- Count chunks to process
  SELECT COUNT(*) INTO chunk_count
  FROM public.semantic_chunks 
  WHERE project_id = p_project_id
    AND (p_chapter_id IS NULL OR chapter_id = p_chapter_id);
  
  -- This will be populated by the actual extraction logic
  knowledge_count := 0;
  
  RETURN QUERY SELECT 
    chunk_count,
    knowledge_count,
    now() - start_time;
END;
$function$;

-- Fix check_cross_chapter_consistency function
CREATE OR REPLACE FUNCTION public.check_cross_chapter_consistency(p_project_id uuid)
 RETURNS TABLE(inconsistencies_found integer, characters_checked integer, relationships_checked integer, plot_threads_checked integer)
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  inconsistency_count int := 0;
  char_count int := 0;
  rel_count int := 0;
  plot_count int := 0;
BEGIN
  -- Count characters
  SELECT COUNT(*) INTO char_count
  FROM public.knowledge_base 
  WHERE project_id = p_project_id AND category = 'character';
  
  -- Count relationships
  SELECT COUNT(*) INTO rel_count
  FROM public.character_relationships 
  WHERE project_id = p_project_id;
  
  -- Count plot threads
  SELECT COUNT(*) INTO plot_count
  FROM public.plot_threads 
  WHERE project_id = p_project_id;
  
  -- Placeholder for consistency checking logic
  inconsistency_count := 0;
  
  RETURN QUERY SELECT 
    inconsistency_count,
    char_count,
    rel_count,
    plot_count;
END;
$function$;

-- Fix update_knowledge_confidence_scores function
CREATE OR REPLACE FUNCTION public.update_knowledge_confidence_scores(p_project_id uuid)
 RETURNS TABLE(knowledge_updated integer, avg_confidence_before numeric, avg_confidence_after numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  updated_count int := 0;
  conf_before numeric := 0;
  conf_after numeric := 0;
BEGIN
  -- Get average confidence before
  SELECT COALESCE(AVG(confidence_score), 0) INTO conf_before
  FROM public.knowledge_base 
  WHERE project_id = p_project_id;
  
  -- Update confidence scores based on cross-validation
  -- This is a placeholder - actual logic will be implemented in the AI service
  UPDATE public.knowledge_base 
  SET confidence_score = LEAST(1.0, confidence_score + 0.1)
  WHERE project_id = p_project_id 
    AND confidence_score < 0.9;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Get average confidence after
  SELECT COALESCE(AVG(confidence_score), 0) INTO conf_after
  FROM public.knowledge_base 
  WHERE project_id = p_project_id;
  
  RETURN QUERY SELECT 
    updated_count,
    conf_before,
    conf_after;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$function$;
