-- Clean up the incorrect enhanced_content for "Au fond de Nerupt" chapter refinement
UPDATE chapter_refinements 
SET enhanced_content = NULL, 
    updated_at = now()
WHERE id = '0164afe4-7b6c-4324-8e6e-30e64711a2ed';