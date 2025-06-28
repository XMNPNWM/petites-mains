
-- Add the missing updated_at column to knowledge_processing_jobs table
ALTER TABLE public.knowledge_processing_jobs 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_knowledge_processing_jobs_updated_at
  BEFORE UPDATE ON public.knowledge_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
