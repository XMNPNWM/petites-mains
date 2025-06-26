
import { supabase } from '@/integrations/supabase/client';
import { 
  CharacterRelationship, 
  PlotThread, 
  TimelineEvent, 
  ConflictTracking,
  AIAnalysisStatus 
} from '@/types/aiIntelligence';

export class AIIntelligenceService {
  
  // Character Relationships
  static async getCharacterRelationships(projectId: string): Promise<CharacterRelationship[]> {
    const { data, error } = await supabase
      .from('character_relationships')
      .select('*')
      .eq('project_id', projectId)
      .order('relationship_strength', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createCharacterRelationship(
    relationship: Omit<CharacterRelationship, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CharacterRelationship> {
    const { data, error } = await supabase
      .from('character_relationships')
      .insert(relationship)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateCharacterRelationship(
    id: string, 
    updates: Partial<CharacterRelationship>
  ): Promise<void> {
    const { error } = await supabase
      .from('character_relationships')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  // Plot Threads
  static async getPlotThreads(projectId: string): Promise<PlotThread[]> {
    const { data, error } = await supabase
      .from('plot_threads')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createPlotThread(
    thread: Omit<PlotThread, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PlotThread> {
    const { data, error } = await supabase
      .from('plot_threads')
      .insert(thread)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePlotThread(id: string, updates: Partial<PlotThread>): Promise<void> {
    const { error } = await supabase
      .from('plot_threads')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  // Timeline Events
  static async getTimelineEvents(projectId: string): Promise<TimelineEvent[]> {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('project_id', projectId)
      .order('chronological_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createTimelineEvent(
    event: Omit<TimelineEvent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TimelineEvent> {
    const { data, error } = await supabase
      .from('timeline_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTimelineEvent(id: string, updates: Partial<TimelineEvent>): Promise<void> {
    const { error } = await supabase
      .from('timeline_events')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  // Conflict Tracking
  static async getConflictTracking(projectId: string): Promise<ConflictTracking[]> {
    const { data, error } = await supabase
      .from('conflict_tracking')
      .select('*')
      .eq('project_id', projectId)
      .order('current_intensity', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createConflictTracking(
    conflict: Omit<ConflictTracking, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ConflictTracking> {
    const { data, error } = await supabase
      .from('conflict_tracking')
      .insert(conflict)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateConflictTracking(id: string, updates: Partial<ConflictTracking>): Promise<void> {
    const { error } = await supabase
      .from('conflict_tracking')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  // Analysis Status
  static async getAnalysisStatus(projectId: string): Promise<AIAnalysisStatus> {
    try {
      // Get current processing jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('knowledge_processing_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('started_at', { ascending: false })
        .limit(1);

      if (jobsError) throw jobsError;

      const currentJob = jobs?.[0];
      const isProcessing = currentJob?.state === 'pending' || 
                          currentJob?.state === 'thinking' || 
                          currentJob?.state === 'analyzing' || 
                          currentJob?.state === 'extracting';

      // Get flagged knowledge count
      const { count: flaggedCount, error: flaggedError } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('is_flagged', true);

      if (flaggedError) throw flaggedError;

      // Get error count from failed jobs
      const { count: errorCount, error: errorCountError } = await supabase
        .from('knowledge_processing_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('state', 'failed');

      if (errorCountError) throw errorCountError;

      return {
        isProcessing,
        hasErrors: (errorCount || 0) > 0,
        lastProcessedAt: currentJob?.completed_at || undefined,
        currentStep: currentJob?.current_step || undefined,
        progress: currentJob?.progress_percentage || 0,
        errorCount: errorCount || 0,
        flaggedItemsCount: flaggedCount || 0
      };
    } catch (error) {
      console.error('Error getting analysis status:', error);
      return {
        isProcessing: false,
        hasErrors: true,
        progress: 0,
        errorCount: 1,
        flaggedItemsCount: 0
      };
    }
  }

  // Flagged Items Management
  static async getFlaggedItems(projectId: string) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_flagged', true)
      .order('confidence_score', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async reviewFlaggedItem(id: string, approved: boolean, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('knowledge_base')
      .update({
        is_flagged: false,
        is_verified: approved,
        review_notes: notes
      })
      .eq('id', id);

    if (error) throw error;
  }
}
