-- Clean up corrupted refinement records with minimal content
DELETE FROM chapter_refinements 
WHERE enhanced_content = '<p></p>' 
  AND refinement_status = 'in_progress';