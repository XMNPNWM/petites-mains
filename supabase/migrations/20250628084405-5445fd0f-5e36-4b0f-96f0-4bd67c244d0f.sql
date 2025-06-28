
-- Enable RLS and create policies for author_styles table
ALTER TABLE public.author_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own author styles" 
  ON public.author_styles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = author_styles.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create author styles for their projects" 
  ON public.author_styles 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = author_styles.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own author styles" 
  ON public.author_styles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = author_styles.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own author styles" 
  ON public.author_styles 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = author_styles.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- Enable RLS and create policies for content_hashes table
ALTER TABLE public.content_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content hashes for their chapters" 
  ON public.content_hashes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM chapters c 
      JOIN projects p ON c.project_id = p.id 
      WHERE c.id = content_hashes.chapter_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create content hashes for their chapters" 
  ON public.content_hashes 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chapters c 
      JOIN projects p ON c.project_id = p.id 
      WHERE c.id = content_hashes.chapter_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update content hashes for their chapters" 
  ON public.content_hashes 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM chapters c 
      JOIN projects p ON c.project_id = p.id 
      WHERE c.id = content_hashes.chapter_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete content hashes for their chapters" 
  ON public.content_hashes 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM chapters c 
      JOIN projects p ON c.project_id = p.id 
      WHERE c.id = content_hashes.chapter_id 
      AND p.user_id = auth.uid()
    )
  );

-- Enable RLS and create policies for knowledge_change_log table
ALTER TABLE public.knowledge_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view knowledge change logs for their projects" 
  ON public.knowledge_change_log 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_base kb 
      JOIN projects p ON kb.project_id = p.id 
      WHERE kb.id = knowledge_change_log.knowledge_base_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create knowledge change logs" 
  ON public.knowledge_change_log 
  FOR INSERT 
  WITH CHECK (true);

-- Enable RLS and create policies for knowledge_base table
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project knowledge" 
  ON public.knowledge_base 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = knowledge_base.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create knowledge for their projects" 
  ON public.knowledge_base 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = knowledge_base.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own project knowledge" 
  ON public.knowledge_base 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = knowledge_base.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own project knowledge" 
  ON public.knowledge_base 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = knowledge_base.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- Enable RLS and create policies for knowledge_facts table
ALTER TABLE public.knowledge_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view knowledge facts for their projects" 
  ON public.knowledge_facts 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_base kb 
      JOIN projects p ON kb.project_id = p.id 
      WHERE kb.id = knowledge_facts.knowledge_base_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create knowledge facts for their projects" 
  ON public.knowledge_facts 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_base kb 
      JOIN projects p ON kb.project_id = p.id 
      WHERE kb.id = knowledge_facts.knowledge_base_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update knowledge facts for their projects" 
  ON public.knowledge_facts 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_base kb 
      JOIN projects p ON kb.project_id = p.id 
      WHERE kb.id = knowledge_facts.knowledge_base_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete knowledge facts for their projects" 
  ON public.knowledge_facts 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_base kb 
      JOIN projects p ON kb.project_id = p.id 
      WHERE kb.id = knowledge_facts.knowledge_base_id 
      AND p.user_id = auth.uid()
    )
  );

-- Enable RLS and create policies for knowledge_processing_jobs table
ALTER TABLE public.knowledge_processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view processing jobs for their projects" 
  ON public.knowledge_processing_jobs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = knowledge_processing_jobs.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create processing jobs for their projects" 
  ON public.knowledge_processing_jobs 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = knowledge_processing_jobs.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update processing jobs for their projects" 
  ON public.knowledge_processing_jobs 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = knowledge_processing_jobs.project_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete processing jobs for their projects" 
  ON public.knowledge_processing_jobs 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = knowledge_processing_jobs.project_id 
      AND p.user_id = auth.uid()
    )
  );
