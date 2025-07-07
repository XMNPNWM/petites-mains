
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeBase, ChapterSummary, PlotPoint } from '@/types/knowledge';

interface PlotThread {
  id: string;
  project_id: string;
  thread_name: string;
  thread_type: string;
  thread_status: string;
  resolution_status?: string;
  key_events?: string[];
  characters_involved_names?: string[];
  ai_confidence_new?: number;
  source_chapter_ids?: string[];
  is_newly_extracted?: boolean;
  evidence?: string;
  created_at: string;
  updated_at: string;
}

interface TimelineEvent {
  id: string;
  project_id: string;
  event_name: string;
  event_type: string;
  event_description?: string;
  event_summary?: string;
  chronological_order: number;
  date_or_time_reference?: string;
  significance?: string;
  characters_involved_names?: string[];
  plot_threads_impacted_names?: string[];
  locations_involved_names?: string[];
  ai_confidence_new?: number;
  source_chapter_ids?: string[];
  is_newly_extracted?: boolean;
  created_at: string;
  updated_at: string;
}

interface CharacterRelationship {
  id: string;
  project_id: string;
  character_a_name: string;
  character_b_name: string;
  relationship_type: string;
  relationship_strength: number;
  relationship_current_status?: string;
  ai_confidence_new?: number;
  source_chapter_ids?: string[];
  is_newly_extracted?: boolean;
  evidence?: string;
  created_at: string;
  updated_at: string;
}

interface WorldBuildingElement {
  id: string;
  project_id: string;
  name: string;
  type: string;
  description?: string;
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AIBrainData {
  knowledge: KnowledgeBase[];
  chapterSummaries: ChapterSummary[];
  plotPoints: PlotPoint[];
  plotThreads: PlotThread[];
  timelineEvents: TimelineEvent[];
  characterRelationships: CharacterRelationship[];
  worldBuilding: WorldBuildingElement[];
  themes: KnowledgeBase[];
  isLoading: boolean;
  error: string | null;
}

export const useAIBrainData = (projectId: string): AIBrainData => {
  const [data, setData] = useState<AIBrainData>({
    knowledge: [],
    chapterSummaries: [],
    plotPoints: [],
    plotThreads: [],
    timelineEvents: [],
    characterRelationships: [],
    worldBuilding: [],
    themes: [],
    isLoading: true,
    error: null
  });

  const fetchAllData = async () => {
    try {
      console.log('🔄 Fetching all AI Brain data for project:', projectId);
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch all data types in parallel
      const [
        knowledgeResponse,
        chapterSummariesResponse,
        plotPointsResponse,
        plotThreadsResponse,
        timelineEventsResponse,
        characterRelationshipsResponse
      ] = await Promise.all([
        // 1. Knowledge Base (all categories)
        supabase
          .from('knowledge_base')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        
        // 2. Chapter Summaries
        supabase
          .from('chapter_summaries')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        
        // 3. Plot Points  
        supabase
          .from('plot_points')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        
        // 4. Plot Threads
        supabase
          .from('plot_threads')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        
        // 5. Timeline Events
        supabase
          .from('timeline_events')
          .select('*')
          .eq('project_id', projectId)
          .order('chronological_order', { ascending: true }),
        
        // 6. Character Relationships
        supabase
          .from('character_relationships')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
      ]);

      // Check for errors
      const errors = [
        knowledgeResponse.error,
        chapterSummariesResponse.error,
        plotPointsResponse.error,
        plotThreadsResponse.error,
        timelineEventsResponse.error,
        characterRelationshipsResponse.error
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('❌ Errors fetching AI Brain data:', errors);
        throw new Error(`Failed to fetch data: ${errors.map(e => e?.message).join(', ')}`);
      }

      // Process and type the data
      const allKnowledge: KnowledgeBase[] = (knowledgeResponse.data || []).map(item => ({
        ...item,
        details: typeof item.details === 'string' ? JSON.parse(item.details) : (item.details as Record<string, any>) || {},
        source_chapter_ids: (item.source_chapter_ids as string[]) || []
      }));

      const chapterSummaries: ChapterSummary[] = (chapterSummariesResponse.data || []).map(item => ({
        ...item,
        key_events_in_chapter: (item.key_events_in_chapter as string[]) || [],
        primary_focus: (item.primary_focus as string[]) || []
      }));

      const plotPoints: PlotPoint[] = (plotPointsResponse.data || []).map(item => ({
        ...item,
        characters_involved_names: (item.characters_involved_names as string[]) || [],
        source_chapter_ids: (item.source_chapter_ids as string[]) || []
      }));

      const plotThreads: PlotThread[] = (plotThreadsResponse.data || []).map(item => ({
        ...item,
        key_events: (item.key_events as string[]) || [],
        characters_involved_names: (item.characters_involved_names as string[]) || [],
        source_chapter_ids: (item.source_chapter_ids as string[]) || []
      }));

      const timelineEvents: TimelineEvent[] = (timelineEventsResponse.data || []).map(item => ({
        ...item,
        characters_involved_names: (item.characters_involved_names as string[]) || [],
        plot_threads_impacted_names: (item.plot_threads_impacted_names as string[]) || [],
        locations_involved_names: (item.locations_involved_names as string[]) || [],
        source_chapter_ids: (item.source_chapter_ids as string[]) || []
      }));

      const characterRelationships: CharacterRelationship[] = (characterRelationshipsResponse.data || []).map(item => ({
        ...item,
        source_chapter_ids: (item.source_chapter_ids as string[]) || []
      }));

      // Extract world building elements from knowledge_base where category='world_building'
      // This ensures AI Brain only shows AI-extracted world building data
      const worldBuilding: WorldBuildingElement[] = allKnowledge
        .filter(item => item.category === 'world_building')
        .map(item => ({
          id: item.id,
          project_id: item.project_id,
          name: item.name,
          type: item.subcategory || 'general',
          description: item.description,
          details: item.details,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));

      // Separate themes from general knowledge
      const themes = allKnowledge.filter(item => item.category === 'theme');
      const generalKnowledge = allKnowledge.filter(item => 
        item.category !== 'theme' && item.category !== 'world_building'
      );

      console.log('📊 AI Brain data fetched successfully:', {
        knowledge: generalKnowledge.length,
        chapterSummaries: chapterSummaries.length,
        plotPoints: plotPoints.length,
        plotThreads: plotThreads.length,
        timelineEvents: timelineEvents.length,
        characterRelationships: characterRelationships.length,
        worldBuilding: worldBuilding.length,
        themes: themes.length
      });

      setData({
        knowledge: generalKnowledge,
        chapterSummaries,
        plotPoints,
        plotThreads,
        timelineEvents,
        characterRelationships,
        worldBuilding,
        themes,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Error fetching AI Brain data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch AI Brain data'
      }));
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchAllData();
    }
  }, [projectId]);

  return data;
};
