-- Force clean "Au fond de Nerupt" enhanced content
UPDATE chapter_refinements 
SET enhanced_content = '',
    refinement_status = 'untouched',
    updated_at = now()
WHERE chapter_id = 'c8758b10-325e-4828-b659-86d09a354eea';