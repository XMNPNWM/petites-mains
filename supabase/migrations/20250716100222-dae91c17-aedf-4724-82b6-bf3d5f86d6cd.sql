-- Phase 3: Bidirectional Content Management - Database Schema Updates

-- Create content_versions table for tracking content history
CREATE TABLE public.content_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('creation', 'enhancement')),
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_from_refinement_id UUID NULL,
  enhancement_options JSONB NULL DEFAULT '{}',
  refinement_status TEXT NULL,
  word_count INTEGER NULL DEFAULT 0,
  change_summary TEXT NULL,
  user_notes TEXT NULL
);

-- Add indexes for performance
CREATE INDEX idx_content_versions_chapter_id ON public.content_versions(chapter_id);
CREATE INDEX idx_content_versions_type_created ON public.content_versions(content_type, created_at DESC);
CREATE INDEX idx_content_versions_refinement_id ON public.content_versions(created_from_refinement_id);

-- Add foreign key constraints
ALTER TABLE public.content_versions 
ADD CONSTRAINT fk_content_versions_chapter_id 
FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;

ALTER TABLE public.content_versions 
ADD CONSTRAINT fk_content_versions_refinement_id 
FOREIGN KEY (created_from_refinement_id) REFERENCES public.chapter_refinements(id) ON DELETE SET NULL;

-- Enable RLS on content_versions
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_versions
CREATE POLICY "Users can access their own content versions" ON public.content_versions
FOR ALL USING (
  chapter_id IN (
    SELECT c.id FROM chapters c
    JOIN projects p ON c.project_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Add new columns to chapters table for tracking enhancement imports
ALTER TABLE public.chapters 
ADD COLUMN last_enhancement_import_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN enhancement_source_refinement_id UUID NULL,
ADD COLUMN content_version_number INTEGER NOT NULL DEFAULT 1;

-- Add foreign key for enhancement source
ALTER TABLE public.chapters 
ADD CONSTRAINT fk_chapters_enhancement_source 
FOREIGN KEY (enhancement_source_refinement_id) REFERENCES public.chapter_refinements(id) ON DELETE SET NULL;

-- Add new columns to chapter_refinements table for tracking creation sync
ALTER TABLE public.chapter_refinements 
ADD COLUMN creation_import_version INTEGER NULL DEFAULT 1,
ADD COLUMN last_creation_sync_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN original_content_version INTEGER NULL DEFAULT 1;

-- Create function to automatically increment version numbers
CREATE OR REPLACE FUNCTION public.increment_content_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the current max version number for this chapter and content type
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO NEW.version_number
  FROM public.content_versions 
  WHERE chapter_id = NEW.chapter_id 
  AND content_type = NEW.content_type;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-increment version numbers
CREATE TRIGGER trigger_increment_content_version
  BEFORE INSERT ON public.content_versions
  FOR EACH ROW EXECUTE FUNCTION public.increment_content_version();

-- Create function to update chapter version number on content change
CREATE OR REPLACE FUNCTION public.update_chapter_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.content_version_number = OLD.content_version_number + 1;
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-increment chapter version
CREATE TRIGGER trigger_update_chapter_version
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_chapter_version();