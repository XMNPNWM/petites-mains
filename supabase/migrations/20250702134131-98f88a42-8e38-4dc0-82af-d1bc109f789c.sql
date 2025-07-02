
-- Phase 1: Foundation Database Schema
-- Enhanced content hashes with dependency tracking
CREATE TABLE IF NOT EXISTS content_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    content_hash TEXT NOT NULL,
    dependencies TEXT[] DEFAULT '{}', -- ["char_alice", "plot_thread_mystery"]
    affects TEXT[] DEFAULT '{}',      -- What this content impacts
    last_processed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analysis_version TEXT DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis results with confidence and versioning
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL, -- Can reference chapters or other content
    content_type TEXT NOT NULL DEFAULT 'chapter', -- 'chapter', 'character', 'plot_thread'
    analysis_type TEXT NOT NULL, -- 'character_extraction', 'plot_analysis', 'summary'
    version TEXT NOT NULL DEFAULT '1.0',
    ai_data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.50 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    low_confidence_flags TEXT[] DEFAULT '{}',
    is_flagged BOOLEAN DEFAULT FALSE,
    last_human_review TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User overrides for AI analysis
CREATE TABLE IF NOT EXISTS user_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_result_id UUID REFERENCES analysis_results(id) ON DELETE CASCADE,
    field_path TEXT NOT NULL, -- JSON path like "character.traits.stubbornness"
    original_ai_value JSONB,
    user_value JSONB NOT NULL,
    override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dependency graph for content relationships
CREATE TABLE IF NOT EXISTS dependency_graph (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_content_id UUID NOT NULL,
    source_content_type TEXT NOT NULL,
    dependent_content_id UUID NOT NULL,
    dependent_content_type TEXT NOT NULL,
    dependency_type TEXT NOT NULL, -- 'character_mention', 'plot_reference', 'world_rule'
    strength DECIMAL(3,2) DEFAULT 0.50, -- How strong the dependency is
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_content_id, dependent_content_id, dependency_type)
);

-- Add RLS policies for new tables
ALTER TABLE content_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_graph ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_hashes
CREATE POLICY "Users can access their own content hashes" ON content_hashes
    USING (chapter_id IN (
        SELECT c.id FROM chapters c 
        JOIN projects p ON c.project_id = p.id 
        WHERE p.user_id = auth.uid()
    ));

-- RLS policies for analysis_results
CREATE POLICY "Users can access their own analysis results" ON analysis_results
    USING (
        CASE 
            WHEN content_type = 'chapter' THEN
                content_id IN (
                    SELECT c.id FROM chapters c 
                    JOIN projects p ON c.project_id = p.id 
                    WHERE p.user_id = auth.uid()
                )
            ELSE TRUE -- For now, allow access to other content types
        END
    );

-- RLS policies for user_overrides
CREATE POLICY "Users can access their own user overrides" ON user_overrides
    USING (analysis_result_id IN (
        SELECT ar.id FROM analysis_results ar
        WHERE 
            CASE 
                WHEN ar.content_type = 'chapter' THEN
                    ar.content_id IN (
                        SELECT c.id FROM chapters c 
                        JOIN projects p ON c.project_id = p.id 
                        WHERE p.user_id = auth.uid()
                    )
                ELSE TRUE
            END
    ));

-- RLS policies for dependency_graph
CREATE POLICY "Users can access their own dependency graph" ON dependency_graph
    USING (
        source_content_id IN (
            SELECT c.id FROM chapters c 
            JOIN projects p ON c.project_id = p.id 
            WHERE p.user_id = auth.uid()
        ) OR
        dependent_content_id IN (
            SELECT c.id FROM chapters c 
            JOIN projects p ON c.project_id = p.id 
            WHERE p.user_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_hashes_chapter_id ON content_hashes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_content ON analysis_results(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_analysis_results_confidence ON analysis_results(confidence_score) WHERE confidence_score < 0.7;
CREATE INDEX IF NOT EXISTS idx_user_overrides_analysis ON user_overrides(analysis_result_id);
CREATE INDEX IF NOT EXISTS idx_dependency_graph_source ON dependency_graph(source_content_id, source_content_type);
CREATE INDEX IF NOT EXISTS idx_dependency_graph_dependent ON dependency_graph(dependent_content_id, dependent_content_type);
