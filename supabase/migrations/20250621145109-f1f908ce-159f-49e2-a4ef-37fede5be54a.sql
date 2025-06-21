
-- Create table for storing enhanced chapter versions and refinement data
CREATE TABLE public.chapter_refinements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  original_content TEXT,
  enhanced_content TEXT,
  refinement_status TEXT NOT NULL DEFAULT 'untouched' CHECK (refinement_status IN ('untouched', 'in_progress', 'completed', 'updated')),
  ai_changes JSONB DEFAULT '[]'::jsonb,
  user_preferences JSONB DEFAULT '{}'::jsonb,
  context_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(chapter_id)
);

-- Create table for tracking AI change categories and user decisions
CREATE TABLE public.ai_change_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  refinement_id UUID NOT NULL REFERENCES chapter_refinements(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('grammar', 'structure', 'dialogue', 'style')),
  original_text TEXT NOT NULL,
  enhanced_text TEXT NOT NULL,
  position_start INTEGER NOT NULL,
  position_end INTEGER NOT NULL,
  user_decision TEXT CHECK (user_decision IN ('accepted', 'rejected', 'pending')) DEFAULT 'pending',
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for chapter quality metrics
CREATE TABLE public.chapter_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  refinement_id UUID NOT NULL REFERENCES chapter_refinements(id) ON DELETE CASCADE,
  readability_score DECIMAL(4,2),
  dialogue_ratio DECIMAL(3,2),
  pacing_score DECIMAL(3,2),
  consistency_score DECIMAL(3,2),
  word_count INTEGER,
  sentence_variety DECIMAL(3,2),
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(refinement_id)
);

-- Add RLS policies for chapter_refinements
ALTER TABLE public.chapter_refinements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chapter refinements" 
  ON public.chapter_refinements 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM chapters c 
      JOIN projects p ON c.project_id = p.id 
      WHERE c.id = chapter_refinements.chapter_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own chapter refinements" 
  ON public.chapter_refinements 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters c 
      JOIN projects p ON c.project_id = p.id 
      WHERE c.id = chapter_refinements.chapter_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own chapter refinements" 
  ON public.chapter_refinements 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM chapters c 
      JOIN projects p ON c.project_id = p.id 
      WHERE c.id = chapter_refinements.chapter_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own chapter refinements" 
  ON public.chapter_refinements 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM chapters c 
      JOIN projects p ON c.project_id = p.id 
      WHERE c.id = chapter_refinements.chapter_id 
      AND p.user_id = auth.uid()
    )
  );

-- Add RLS policies for ai_change_tracking
ALTER TABLE public.ai_change_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI change tracking" 
  ON public.ai_change_tracking 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM chapter_refinements cr
      JOIN chapters c ON cr.chapter_id = c.id
      JOIN projects p ON c.project_id = p.id 
      WHERE cr.id = ai_change_tracking.refinement_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own AI change tracking" 
  ON public.ai_change_tracking 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapter_refinements cr
      JOIN chapters c ON cr.chapter_id = c.id
      JOIN projects p ON c.project_id = p.id 
      WHERE cr.id = ai_change_tracking.refinement_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own AI change tracking" 
  ON public.ai_change_tracking 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM chapter_refinements cr
      JOIN chapters c ON cr.chapter_id = c.id
      JOIN projects p ON c.project_id = p.id 
      WHERE cr.id = ai_change_tracking.refinement_id 
      AND p.user_id = auth.uid()
    )
  );

-- Add RLS policies for chapter_metrics
ALTER TABLE public.chapter_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chapter metrics" 
  ON public.chapter_metrics 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM chapter_refinements cr
      JOIN chapters c ON cr.chapter_id = c.id
      JOIN projects p ON c.project_id = p.id 
      WHERE cr.id = chapter_metrics.refinement_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own chapter metrics" 
  ON public.chapter_metrics 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapter_refinements cr
      JOIN chapters c ON cr.chapter_id = c.id
      JOIN projects p ON c.project_id = p.id 
      WHERE cr.id = chapter_metrics.refinement_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own chapter metrics" 
  ON public.chapter_metrics 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM chapter_refinements cr
      JOIN chapters c ON cr.chapter_id = c.id
      JOIN projects p ON c.project_id = p.id 
      WHERE cr.id = chapter_metrics.refinement_id 
      AND p.user_id = auth.uid()
    )
  );
