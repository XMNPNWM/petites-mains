-- Create export_configs table for saving export settings
CREATE TABLE IF NOT EXISTS public.export_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  config_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create export_history table for tracking export actions
CREATE TABLE IF NOT EXISTS public.export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  export_format TEXT NOT NULL,
  template_id TEXT NOT NULL,
  selected_chapters JSONB NOT NULL DEFAULT '[]',
  file_size_bytes INTEGER,
  export_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.export_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for export_configs
CREATE POLICY "Users can view their own export configs"
  ON public.export_configs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own export configs"
  ON public.export_configs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own export configs"
  ON public.export_configs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own export configs"
  ON public.export_configs FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for export_history
CREATE POLICY "Users can view their own export history"
  ON public.export_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own export history"
  ON public.export_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own export history"
  ON public.export_history FOR UPDATE
  USING (user_id = auth.uid());

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_export_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_export_configs_updated_at
  BEFORE UPDATE ON public.export_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_export_config_timestamp();