-- Fix the knowledge change log trigger to handle deletions properly
-- The trigger is trying to insert a log entry after deletion but the foreign key fails

-- First, let's modify the log_knowledge_change function to handle deletions correctly
CREATE OR REPLACE FUNCTION public.log_knowledge_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- For DELETE operations, we need to log BEFORE the deletion happens
  -- For other operations, we can log after
  
  IF TG_OP = 'DELETE' THEN
    -- Log the deletion before it happens
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
      OLD.id,
      'deletion'::public.change_type,
      'knowledge_base_record',
      OLD.name,
      NULL,
      OLD.confidence_score,
      NULL,
      'User initiated deletion'
    );
    RETURN OLD;
  ELSE
    -- For INSERT and UPDATE, log after the operation
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
      END,
      'knowledge_base_record',
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.name ELSE NULL END,
      CASE WHEN TG_OP != 'DELETE' THEN NEW.name ELSE NULL END,
      CASE WHEN TG_OP != 'INSERT' THEN OLD.confidence_score ELSE NULL END,
      CASE WHEN TG_OP != 'DELETE' THEN NEW.confidence_score ELSE NULL END,
      'Automated change logging'
    );
    RETURN NEW;
  END IF;
END;
$function$;

-- Update the trigger to fire BEFORE DELETE instead of AFTER
DROP TRIGGER IF EXISTS log_knowledge_changes ON public.knowledge_base;

CREATE TRIGGER log_knowledge_changes
  BEFORE INSERT OR UPDATE OR DELETE ON public.knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.log_knowledge_change();