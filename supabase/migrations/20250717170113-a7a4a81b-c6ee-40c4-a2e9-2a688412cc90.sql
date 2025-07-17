-- Fix contamination: Reset "Au fond de Nerupt" enhanced content to NULL
UPDATE chapter_refinements 
SET enhanced_content = NULL,
    refinement_status = 'untouched',
    updated_at = now()
WHERE id = '0164afe4-7b6c-4324-8e6e-30e64711a2ed';

-- Verify "Le Mal" keeps its content (just updating timestamp for verification)
UPDATE chapter_refinements 
SET updated_at = now()
WHERE id = 'bde97a5c-e334-4ef9-bfc5-a77ae55d5c26';