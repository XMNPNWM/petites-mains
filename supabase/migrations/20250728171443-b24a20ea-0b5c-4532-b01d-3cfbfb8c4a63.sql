-- Create the enhanced log_knowledge_change trigger function with debugging
CREATE OR REPLACE FUNCTION public.log_knowledge_change()
RETURNS TRIGGER AS $$
DECLARE
  target_id uuid;
  debug_info text;
BEGIN
  -- Detailed logging for debugging FK constraint issues
  
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.id;
    debug_info := format('DELETE: OLD.id=%s, target_id=%s', OLD.id, target_id);
    RAISE NOTICE '[TRIGGER DEBUG] %', debug_info;
    
    BEGIN
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
        target_id,
        'deletion'::public.change_type,
        'knowledge_base_record',
        OLD.name,
        NULL,
        OLD.confidence_score,
        NULL,
        'User initiated deletion'
      );
      
      RAISE NOTICE '[TRIGGER SUCCESS] DELETE log inserted for knowledge_base_id=%s', target_id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[TRIGGER ERROR] DELETE failed: SQLSTATE=%, SQLERRM=%, target_id=%', SQLSTATE, SQLERRM, target_id;
      -- Don't fail the deletion operation
    END;
    
    RETURN OLD;
    
  ELSE
    -- For INSERT and UPDATE operations
    target_id := COALESCE(NEW.id, OLD.id);
    debug_info := format('INSERT/UPDATE: TG_OP=%s, NEW.id=%s, OLD.id=%s, COALESCE result=%s', 
                        TG_OP, NEW.id, COALESCE(OLD.id, 'NULL'), target_id);
    RAISE NOTICE '[TRIGGER DEBUG] %', debug_info;
    
    -- Additional debugging: check if the knowledge_base record exists
    IF target_id IS NOT NULL THEN
      DECLARE
        exists_check boolean;
      BEGIN
        SELECT EXISTS(SELECT 1 FROM public.knowledge_base WHERE id = target_id) INTO exists_check;
        RAISE NOTICE '[TRIGGER DEBUG] knowledge_base record with id=%s exists: %', target_id, exists_check;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[TRIGGER DEBUG] Error checking existence: %', SQLERRM;
      END;
    ELSE
      RAISE WARNING '[TRIGGER ERROR] target_id is NULL! This should not happen for INSERT/UPDATE';
    END IF;
    
    BEGIN
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
        target_id,
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
      
      RAISE NOTICE '[TRIGGER SUCCESS] %s log inserted for knowledge_base_id=%s', TG_OP, target_id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[TRIGGER ERROR] %s failed: SQLSTATE=%, SQLERRM=%, target_id=%s, NEW.id=%s', 
                    TG_OP, SQLSTATE, SQLERRM, target_id, NEW.id;
      
      -- Additional debugging for FK violations
      IF SQLSTATE = '23503' THEN
        RAISE WARNING '[TRIGGER ERROR] Foreign key constraint violation detected. Checking data types and constraints...';
        
        -- Log data type information
        DECLARE
          kb_id_type text;
          kcl_id_type text;
        BEGIN
          SELECT data_type INTO kb_id_type 
          FROM information_schema.columns 
          WHERE table_name = 'knowledge_base' AND column_name = 'id';
          
          SELECT data_type INTO kcl_id_type 
          FROM information_schema.columns 
          WHERE table_name = 'knowledge_change_log' AND column_name = 'knowledge_base_id';
          
          RAISE WARNING '[TRIGGER ERROR] Data types: knowledge_base.id=%s, knowledge_change_log.knowledge_base_id=%s', 
                        kb_id_type, kcl_id_type;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING '[TRIGGER ERROR] Could not check data types: %', SQLERRM;
        END;
      END IF;
      
      -- Don't fail the main operation
    END;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER log_knowledge_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.log_knowledge_change();