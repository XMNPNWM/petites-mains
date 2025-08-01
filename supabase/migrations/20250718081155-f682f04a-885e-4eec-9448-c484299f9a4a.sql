
-- Phase 1: Clean Database Contamination
-- Remove the incorrect enhanced content from "Le Mal"'s refinement record
-- Keep "Au fond de Nerupt"'s correct enhanced content

-- Reset "Le Mal" enhanced content to NULL (it should not have "Au fond de Nerupt"'s content)
UPDATE chapter_refinements 
SET enhanced_content = NULL,
    refinement_status = 'untouched',
    updated_at = now()
WHERE chapter_id = 'd835687f-1429-4396-a933-618381eebe38';

-- Verify "Au fond de Nerupt" keeps its correct content
-- (No changes needed for c8758b10-325e-4828-b659-86d09a354eea as it has the correct content)

-- Clean up any potentially contaminated AI change tracking records for "Le Mal"
DELETE FROM ai_change_tracking 
WHERE refinement_id IN (
    SELECT id FROM chapter_refinements 
    WHERE chapter_id = 'd835687f-1429-4396-a933-618381eebe38'
);

-- Phase 2: Fix "Au fond de Nerupt" status from "in_progress" to "completed"
-- This will allow the UI to display the enhanced content properly
UPDATE chapter_refinements 
SET refinement_status = 'completed',
    updated_at = now()
WHERE chapter_id = 'c8758b10-325e-4828-b659-86d09a354eea'
  AND enhanced_content IS NOT NULL
  AND enhanced_content != '';

-- Verify the update with a comment for logging
-- "Au fond de Nerupt" should now have refinement_status = 'completed'
