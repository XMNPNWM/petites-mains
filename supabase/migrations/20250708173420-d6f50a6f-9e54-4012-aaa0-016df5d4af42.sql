-- Phase 1: Database Schema Cleanup - Remove obsolete categories
-- Remove obsolete enum values: 'setting', 'object', 'event' 
-- Keep streamlined categories for better organization

-- First, update any existing records that use obsolete categories to 'other'
UPDATE knowledge_base 
SET category = 'other' 
WHERE category IN ('setting', 'object', 'event');

-- Create new enum without obsolete values
CREATE TYPE knowledge_category_new AS ENUM (
  'character',
  'plot_point', 
  'world_building',
  'theme',
  'relationship',
  'other'
);

-- Update the table to use the new enum
ALTER TABLE knowledge_base 
ALTER COLUMN category TYPE knowledge_category_new 
USING category::text::knowledge_category_new;

-- Drop the old enum and rename the new one
DROP TYPE knowledge_category;
ALTER TYPE knowledge_category_new RENAME TO knowledge_category;

-- Add relevance_score column for intelligent deduplication
ALTER TABLE knowledge_base 
ADD COLUMN IF NOT EXISTS relevance_score NUMERIC DEFAULT 0.5;

-- Add user_edited flag to preserve user modifications
ALTER TABLE knowledge_base 
ADD COLUMN IF NOT EXISTS user_edited BOOLEAN DEFAULT false;

-- Create index for efficient deduplication queries
CREATE INDEX IF NOT EXISTS idx_knowledge_base_dedup 
ON knowledge_base(project_id, category, name, user_edited, relevance_score);

-- Add function to calculate relevance score based on content type
CREATE OR REPLACE FUNCTION calculate_relevance_score(
  category_param knowledge_category,
  description_param TEXT,
  details_param JSONB
) RETURNS NUMERIC AS $$
BEGIN
  -- Higher scores for abilities, powers, key traits
  -- Lower scores for environmental/narrative details
  CASE category_param
    WHEN 'character' THEN
      CASE 
        WHEN description_param ~* 'pouvoir|capacité|don|magie|communiquer|contrôle|transformation' THEN 0.9
        WHEN description_param ~* 'personnalité|caractère|trait|comportement' THEN 0.7
        WHEN description_param ~* 'apparence|physique|taille|couleur' THEN 0.5
        WHEN description_param ~* 'couchette|lit|chambre|environnement' THEN 0.3
        ELSE 0.6
      END
    WHEN 'world_building' THEN 0.8
    WHEN 'theme' THEN 0.7
    WHEN 'plot_point' THEN 0.8
    ELSE 0.5
  END;
END;
$$ LANGUAGE plpgsql;