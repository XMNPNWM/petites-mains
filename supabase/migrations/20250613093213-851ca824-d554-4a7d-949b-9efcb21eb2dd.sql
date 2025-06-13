
-- Add database trigger to update project timestamp when chapters are modified
CREATE OR REPLACE FUNCTION update_project_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the project's updated_at timestamp when a chapter is modified
  UPDATE projects 
  SET updated_at = NOW() 
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chapter updates
CREATE TRIGGER trigger_update_project_on_chapter_change
  AFTER INSERT OR UPDATE OR DELETE ON chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_project_timestamp();

-- Add index for better performance on worldbuilding elements storyline queries
CREATE INDEX IF NOT EXISTS idx_worldbuilding_elements_storyline_node_id 
ON worldbuilding_elements(storyline_node_id);

-- Add index for better performance on project queries
CREATE INDEX IF NOT EXISTS idx_chapters_project_updated_at 
ON chapters(project_id, updated_at DESC);
