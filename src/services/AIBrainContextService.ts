import { supabase } from '@/integrations/supabase/client';

export interface AIBrainContextData {
  knowledge: any[];
  chapterSummaries: any[];
  plotPoints: any[];
  plotThreads: any[];
  timelineEvents: any[];
  characterRelationships: any[];
  worldBuilding: any[];
  themes: any[];
}

export class AIBrainContextService {
  /**
   * Aggregates all AI Brain data for a project
   */
  static async aggregateProjectData(projectId: string): Promise<AIBrainContextData> {
    try {
      console.log('🧠 Aggregating AI Brain context for project:', projectId);

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
        console.error('❌ Errors fetching AI Brain context data:', errors);
        throw new Error(`Failed to fetch context data: ${errors.map(e => e?.message).join(', ')}`);
      }

      // Process the raw data
      const allKnowledge = knowledgeResponse.data || [];
      const chapterSummaries = chapterSummariesResponse.data || [];
      const plotPoints = plotPointsResponse.data || [];
      const plotThreads = plotThreadsResponse.data || [];
      const timelineEvents = timelineEventsResponse.data || [];
      const characterRelationships = characterRelationshipsResponse.data || [];

      // Separate knowledge by category
      const worldBuilding = allKnowledge.filter(item => item.category === 'world_building');
      const themes = allKnowledge.filter(item => item.category === 'theme');
      const generalKnowledge = allKnowledge.filter(item => 
        item.category !== 'theme' && item.category !== 'world_building'
      );

      const contextData: AIBrainContextData = {
        knowledge: generalKnowledge,
        chapterSummaries,
        plotPoints,
        plotThreads,
        timelineEvents,
        characterRelationships,
        worldBuilding,
        themes
      };

      console.log('✅ AI Brain context aggregated:', {
        knowledge: contextData.knowledge.length,
        chapterSummaries: contextData.chapterSummaries.length,
        plotPoints: contextData.plotPoints.length,
        plotThreads: contextData.plotThreads.length,
        timelineEvents: contextData.timelineEvents.length,
        characterRelationships: contextData.characterRelationships.length,
        worldBuilding: contextData.worldBuilding.length,
        themes: contextData.themes.length
      });

      return contextData;
    } catch (error) {
      console.error('❌ Error aggregating AI Brain context:', error);
      throw error;
    }
  }

  /**
   * Formats aggregated data into a coherent narrative context for AI
   */
  static formatAsNarrativeContext(data: AIBrainContextData): string {
    const sections: string[] = [];

    // Character profiles
    const characters = data.knowledge.filter(item => item.category === 'character');
    if (characters.length > 0) {
      sections.push("## CHARACTER PROFILES");
      characters.forEach(char => {
        sections.push(`**${char.name}**${char.subcategory ? ` (${char.subcategory})` : ''}`);
        if (char.description) sections.push(`- ${char.description}`);
        if (char.details && typeof char.details === 'object') {
          Object.entries(char.details).forEach(([key, value]) => {
            if (value) sections.push(`- ${key}: ${value}`);
          });
        }
        sections.push('');
      });
    }

    // Character relationships
    if (data.characterRelationships.length > 0) {
      sections.push("## CHARACTER RELATIONSHIPS");
      data.characterRelationships.forEach(rel => {
        sections.push(`**${rel.character_a_name} ↔ ${rel.character_b_name}** (${rel.relationship_type})`);
        if (rel.evidence) sections.push(`- ${rel.evidence}`);
        sections.push('');
      });
    }

    // Timeline and key events
    if (data.timelineEvents.length > 0) {
      sections.push("## STORY TIMELINE");
      data.timelineEvents.forEach(event => {
        sections.push(`**${event.event_name}** (${event.event_type})`);
        if (event.event_description) sections.push(`- ${event.event_description}`);
        if (event.characters_involved_names && event.characters_involved_names.length > 0) {
          sections.push(`- Characters involved: ${event.characters_involved_names.join(', ')}`);
        }
        sections.push('');
      });
    }

    // Plot threads and arcs
    if (data.plotThreads.length > 0) {
      sections.push("## PLOT THREADS");
      data.plotThreads.forEach(thread => {
        sections.push(`**${thread.thread_name}** (${thread.thread_type})`);
        if (thread.evidence) sections.push(`- ${thread.evidence}`);
        if (thread.thread_status) sections.push(`- Status: ${thread.thread_status}`);
        if (thread.characters_involved_names && thread.characters_involved_names.length > 0) {
          sections.push(`- Characters: ${thread.characters_involved_names.join(', ')}`);
        }
        sections.push('');
      });
    }

    // Key plot points
    if (data.plotPoints.length > 0) {
      sections.push("## KEY PLOT POINTS");
      data.plotPoints.forEach(point => {
        sections.push(`**${point.name}**`);
        if (point.description) sections.push(`- ${point.description}`);
        if (point.significance) sections.push(`- Significance: ${point.significance}`);
        if (point.characters_involved_names && point.characters_involved_names.length > 0) {
          sections.push(`- Characters: ${point.characters_involved_names.join(', ')}`);
        }
        sections.push('');
      });
    }

    // World building
    if (data.worldBuilding.length > 0) {
      sections.push("## WORLD BUILDING");
      data.worldBuilding.forEach(element => {
        sections.push(`**${element.name}**${element.subcategory ? ` (${element.subcategory})` : ''}`);
        if (element.description) sections.push(`- ${element.description}`);
        if (element.details && typeof element.details === 'object') {
          Object.entries(element.details).forEach(([key, value]) => {
            if (value) sections.push(`- ${key}: ${value}`);
          });
        }
        sections.push('');
      });
    }

    // Themes
    if (data.themes.length > 0) {
      sections.push("## STORY THEMES");
      data.themes.forEach(theme => {
        sections.push(`**${theme.name}**`);
        if (theme.description) sections.push(`- ${theme.description}`);
        sections.push('');
      });
    }

    // Chapter summaries
    if (data.chapterSummaries.length > 0) {
      sections.push("## CHAPTER SUMMARIES");
      data.chapterSummaries.forEach(summary => {
        sections.push(`**${summary.title || 'Chapter Summary'}**`);
        if (summary.summary_short) sections.push(`- Brief: ${summary.summary_short}`);
        if (summary.summary_long) sections.push(`- ${summary.summary_long}`);
        if (summary.key_events_in_chapter && summary.key_events_in_chapter.length > 0) {
          sections.push(`- Key events: ${summary.key_events_in_chapter.join(', ')}`);
        }
        sections.push('');
      });
    }

    const context = sections.join('\n');
    
    if (context.trim().length === 0) {
      return "The story context is currently being analyzed. No detailed information is available yet.";
    }

    return context;
  }

  /**
   * Generates comprehensive story context for AI chat
   */
  static async generateStoryContext(projectId: string): Promise<string> {
    try {
      const data = await this.aggregateProjectData(projectId);
      const narrativeContext = this.formatAsNarrativeContext(data);
      
      return `# STORY CONTEXT

You are an AI assistant helping with a creative writing project. Below is the complete context about this story, including characters, plot, world-building, and other important elements that have been analyzed from the manuscript.

${narrativeContext}

---

Use this context to provide informed and relevant assistance to the writer. Reference specific characters, plot elements, and world-building details when appropriate. Help maintain consistency with the established story elements.`;
    } catch (error) {
      console.error('❌ Error generating story context:', error);
      return "I'm having trouble accessing the story context right now, but I'm still here to help with your writing!";
    }
  }
}