-- Fix the foreign key constraint issue by cleaning up existing orphaned records
-- and ensuring proper cascade deletion

-- First, clean up any orphaned knowledge_change_log records
DELETE FROM public.knowledge_change_log 
WHERE knowledge_base_id IS NOT NULL 
AND knowledge_base_id NOT IN (SELECT id FROM public.knowledge_base);

-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.knowledge_change_log 
DROP CONSTRAINT IF EXISTS knowledge_change_log_knowledge_base_id_fkey;

-- Add the foreign key constraint with CASCADE deletion
ALTER TABLE public.knowledge_change_log 
ADD CONSTRAINT knowledge_change_log_knowledge_base_id_fkey 
FOREIGN KEY (knowledge_base_id) 
REFERENCES public.knowledge_base(id) 
ON DELETE CASCADE;