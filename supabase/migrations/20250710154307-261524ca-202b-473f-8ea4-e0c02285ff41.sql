-- Fix foreign key constraint issues for deletions
-- First, update knowledge_change_log to make knowledge_base_id nullable since not all changes are related to knowledge base
ALTER TABLE public.knowledge_change_log 
ALTER COLUMN knowledge_base_id DROP NOT NULL;

-- Add cascade delete behavior for better cleanup when knowledge items are deleted
-- This will automatically remove related log entries when a knowledge base item is deleted
DO $$
BEGIN
  -- Check if foreign key exists before trying to drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'knowledge_change_log_knowledge_base_id_fkey'
    AND table_name = 'knowledge_change_log'
  ) THEN
    ALTER TABLE public.knowledge_change_log 
    DROP CONSTRAINT knowledge_change_log_knowledge_base_id_fkey;
  END IF;
  
  -- Add the foreign key with cascade delete
  ALTER TABLE public.knowledge_change_log 
  ADD CONSTRAINT knowledge_change_log_knowledge_base_id_fkey 
  FOREIGN KEY (knowledge_base_id) REFERENCES public.knowledge_base(id) ON DELETE CASCADE;
EXCEPTION
  WHEN OTHERS THEN
    -- If there are any issues, just continue - the constraint might not exist
    NULL;
END $$;