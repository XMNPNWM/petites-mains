
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeBase, ChapterSummary, PlotPoint } from '@/types/knowledge';
import { AIBrainData, PlotThread, TimelineEvent, CharacterRelationship, WorldBuildingElement } from '@/types/ai-brain';

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
        supabase.from('knowledge_base').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('chapter_summaries').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('plot_points').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('plot_threads').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('timeline_events').select('*').eq('project_id', projectId).order('chronological_order', { ascending: true }),
        supabase.from('character_relationships').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
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

      // Process and type the data with proper JSON to string[] casting
      const allKnowledge: KnowledgeBase[] = (knowledgeResponse.data || []).map(item => ({
        ...item,
        details: typeof item.details === 'string' ? JSON.parse(item.details) : (item.details as Record<string, any>) || {},
        source_chapter_ids: Array.isArray(item.source_chapter_ids) ? item.source_chapter_ids as string[] : []
      }));

      const chapterSummaries: ChapterSummary[] = (chapterSummariesResponse.data || []).map(item => ({
        ...item,
        key_events_in_chapter: Array.isArray(item.key_events_in_chapter) ? item.key_events_in_chapter as string[] : [],
        primary_focus: Array.isArray(item.primary_focus) ? item.primary_focus as string[] : []
      }));

      const plotPoints: PlotPoint[] = (plotPointsResponse.data || []).map(item => ({
        ...item,
        characters_involved_names: Array.isArray(item.characters_involved_names) ? item.characters_involved_names as string[] : [],
        source_chapter_ids: Array.isArray(item.source_chapter_ids) ? item.source_chapter_ids as string[] : []
      }));

      const plotThreads: PlotThread[] = (plotThreadsResponse.data || []).map(item => ({
        ...item,
        key_events: Array.isArray(item.key_events) ? item.key_events as string[] : [],
        characters_involved_names: Array.isArray(item.characters_involved_names) ? item.characters_involved_names as string[] : [],
        source_chapter_ids: Array.isArray(item.source_chapter_ids) ? item.source_chapter_ids as string[] : [],
        temporal_markers: Array.isArray(item.temporal_markers) ? item.temporal_markers as string[] : [],
        dependency_elements: Array.isArray(item.dependency_elements) ? item.dependency_elements as string[] : []
      }));

      const timelineEvents: TimelineEvent[] = (timelineEventsResponse.data || []).map(item => ({
        ...item,
        characters_involved_names: Array.isArray(item.characters_involved_names) ? item.characters_involved_names as string[] : [],
        plot_threads_impacted_names: Array.isArray(item.plot_threads_impacted_names) ? item.plot_threads_impacted_names as string[] : [],
        locations_involved_names: Array.isArray(item.locations_involved_names) ? item.locations_involved_names as string[] : [],
        source_chapter_ids: Array.isArray(item.source_chapter_ids) ? item.source_chapter_ids as string[] : [],
        temporal_markers: Array.isArray(item.temporal_markers) ? item.temporal_markers as string[] : [],
        dependency_elements: Array.isArray(item.dependency_elements) ? item.dependency_elements as string[] : []
      }));

      const characterRelationships: CharacterRelationship[] = (characterRelationshipsResponse.data || []).map(item => ({
        ...item,
        source_chapter_ids: Array.isArray(item.source_chapter_ids) ? item.source_chapter_ids as string[] : [],
        temporal_markers: Array.isArray(item.temporal_markers) ? item.temporal_markers as string[] : [],
        dependency_elements: Array.isArray(item.dependency_elements) ? item.dependency_elements as string[] : []
      }));

      // Extract world building elements from knowledge_base where category='world_building'
      // Keep the full KnowledgeBase structure to preserve all required fields
      const worldBuilding = allKnowledge.filter(item => item.category === 'world_building');

      const themes = allKnowledge.filter(item => item.category === 'theme');
      // Include characters in the main knowledge array for the Characters tab
      const generalKnowledge = allKnowledge.filter(item => 
        item.category !== 'theme' && item.category !== 'world_building'
      );

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

  // Return data with refresh function for inline editing
  return {
    ...data,
    refresh: fetchAllData
  } as AIBrainData & { refresh: () => Promise<void> };
};
