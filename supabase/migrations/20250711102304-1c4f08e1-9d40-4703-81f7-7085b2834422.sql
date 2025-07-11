-- Remove the duplicate/conflicting trigger that's causing deletion failures
-- This removes the old AFTER trigger that conflicts with the new BEFORE trigger

-- Drop the old conflicting trigger
DROP TRIGGER IF EXISTS trigger_log_knowledge_changes ON public.knowledge_base;

-- Verify the correct BEFORE trigger exists (this should already exist from previous migration)
-- The log_knowledge_changes trigger should handle all operations (INSERT, UPDATE, DELETE) BEFORE they happen