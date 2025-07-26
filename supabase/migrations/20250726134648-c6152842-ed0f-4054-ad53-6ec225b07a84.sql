-- Clear corrupted enhanced content for chapter "Au fond de Nerupt"
UPDATE chapter_refinements 
SET enhanced_content = '', 
    refinement_status = 'untouched',
    updated_at = NOW()
WHERE chapter_id = 'c8758b10-325e-4828-b659-86d09a354eea';

-- Delete any associated invalid change tracking records
DELETE FROM ai_change_tracking 
WHERE refinement_id IN (
  SELECT id FROM chapter_refinements 
  WHERE chapter_id = 'c8758b10-325e-4828-b659-86d09a354eea'
);