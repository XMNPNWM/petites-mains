import { supabase } from '@/integrations/supabase/client';

export class SmartAnalysisOrchestrator {
  // Fixed version of storeComprehensiveKnowledge with proper error handling
  static async storeComprehensiveKnowledge(projectId: string, extractedData: any, sourceChapters: any[], forceReExtraction: boolean = false): Promise<number> {
    console.log('🏪 Starting comprehensive knowledge storage (FIXED):', {
      projectId,
      forceReExtraction,
      extractedDataKeys: Object.keys(extractedData || {}),
      sourceChaptersCount: sourceChapters.length
    });

    if (!extractedData) {
      console.warn('⚠️ No extracted data provided for storage');
      return 0;
    }

    let storedCount = 0;
    const sourceChapterIds = sourceChapters.map(c => c.id);

    // Store characters with validation and error propagation
    if (extractedData.characters && extractedData.characters.length > 0) {
      console.log(`👥 Processing ${extractedData.characters.length} characters`);
      for (const character of extractedData.characters) {
        await this.storeCharacter(projectId, character, sourceChapterIds);
        storedCount++;
      }
    }

    // Store relationships with validation and error propagation
    if (extractedData.relationships && extractedData.relationships.length > 0) {
      console.log(`💞 Processing ${extractedData.relationships.length} relationships`);
      for (const relationship of extractedData.relationships) {
        await this.storeRelationship(projectId, relationship, sourceChapterIds);
        storedCount++;
      }
    }

    // Store timeline events with validation and error propagation
    if (extractedData.timelineEvents && extractedData.timelineEvents.length > 0) {
      console.log(`⏰ Processing ${extractedData.timelineEvents.length} timeline events`);
      for (const event of extractedData.timelineEvents) {
        await this.storeTimelineEvent(projectId, event, sourceChapterIds);
        storedCount++;
      }
    }

    // Store plot threads with validation and error propagation
    if (extractedData.plotThreads && extractedData.plotThreads.length > 0) {
      console.log(`🧵 Processing ${extractedData.plotThreads.length} plot threads`);
      for (const plotThread of extractedData.plotThreads) {
        await this.storePlotThread(projectId, plotThread, sourceChapterIds);
        storedCount++;
      }
    }

    // Store plot points with validation and error propagation
    if (extractedData.plotPoints && extractedData.plotPoints.length > 0) {
      console.log(`📍 Processing ${extractedData.plotPoints.length} plot points`);
      for (const plotPoint of extractedData.plotPoints) {
        await this.storePlotPoint(projectId, plotPoint, sourceChapterIds);
        storedCount++;
      }
    }

    // Store chapter summaries with validation and error propagation
    if (extractedData.chapterSummaries && extractedData.chapterSummaries.length > 0) {
      console.log(`📝 Processing ${extractedData.chapterSummaries.length} chapter summaries`);
      for (const summary of extractedData.chapterSummaries) {
        await this.storeChapterSummary(projectId, summary, sourceChapters);
        storedCount++;
      }
    }

    // Store world building elements with validation and error propagation
    if (extractedData.worldBuilding && extractedData.worldBuilding.length > 0) {
      console.log(`🌍 Processing ${extractedData.worldBuilding.length} world building elements`);
      for (const worldElement of extractedData.worldBuilding) {
        await this.storeWorldBuildingElement(projectId, worldElement, sourceChapterIds);
        storedCount++;
      }
    }

    // Store themes with validation and error propagation
    if (extractedData.themes && extractedData.themes.length > 0) {
      console.log(`🎭 Processing ${extractedData.themes.length} themes`);
      for (const theme of extractedData.themes) {
        await this.storeTheme(projectId, theme, sourceChapterIds);
        storedCount++;
      }
    }

    console.log(`✅ Successfully stored ${storedCount} comprehensive knowledge items`);
    return storedCount;
  }

  // Fixed world building storage with validation and error propagation
  private static async storeWorldBuildingElement(projectId: string, worldElement: any, sourceChapterIds: string[]) {
    // Validate required fields
    if (!worldElement.name || typeof worldElement.name !== 'string' || worldElement.name.trim() === '') {
      console.error('❌ Invalid world building element - missing or invalid name:', worldElement);
      throw new Error(`World building element missing required name field: ${JSON.stringify(worldElement)}`);
    }

    console.log('🌍 Storing world building element:', {
      name: worldElement.name,
      type: worldElement.type || 'general',
      hasDescription: !!worldElement.description
    });

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        project_id: projectId,
        name: worldElement.name.trim(),
        category: 'world_building',
        subcategory: worldElement.type || 'general',
        description: worldElement.description || '',
        details: worldElement.details || {},
        confidence_score: worldElement.ai_confidence || 0.8,
        relevance_score: 0.8,
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: worldElement.ai_confidence || 0.8,
        evidence: worldElement.evidence || '',
        reasoning: worldElement.reasoning || ''
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to store world building element:', {
        element: worldElement.name,
        error: error.message,
        details: error
      });
      throw new Error(`Failed to store world building element "${worldElement.name}": ${error.message}`);
    }

    console.log('✅ World building element stored successfully:', {
      id: data.id,
      name: data.name,
      category: data.category
    });
  }

  // Fixed theme storage with validation and error propagation
  private static async storeTheme(projectId: string, theme: any, sourceChapterIds: string[]) {
    // Validate required fields
    if (!theme.name || typeof theme.name !== 'string' || theme.name.trim() === '') {
      console.error('❌ Invalid theme - missing or invalid name:', theme);
      throw new Error(`Theme missing required name field: ${JSON.stringify(theme)}`);
    }

    console.log('🎭 Storing theme:', {
      name: theme.name,
      hasDescription: !!(theme.exploration_summary || theme.description)
    });

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        project_id: projectId,
        name: theme.name.trim(),
        category: 'theme',
        subcategory: theme.type || 'general',
        description: theme.exploration_summary || theme.description || '',
        details: {
          key_moments: theme.key_moments_or_characters || [],
          exploration: theme.exploration_summary
        },
        confidence_score: theme.ai_confidence || 0.7,
        relevance_score: 0.7,
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: theme.ai_confidence || 0.7,
        evidence: theme.evidence || '',
        reasoning: theme.reasoning || ''
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to store theme:', {
        theme: theme.name,
        error: error.message,
        details: error
      });
      throw new Error(`Failed to store theme "${theme.name}": ${error.message}`);
    }

    console.log('✅ Theme stored successfully:', {
      id: data.id,
      name: data.name,
      category: data.category
    });
  }

  // Character storage with validation and error propagation
  private static async storeCharacter(projectId: string, character: any, sourceChapterIds: string[]) {
    if (!character.name || typeof character.name !== 'string' || character.name.trim() === '') {
      console.error('❌ Invalid character - missing or invalid name:', character);
      throw new Error(`Character missing required name field: ${JSON.stringify(character)}`);
    }

    console.log('👥 Storing character:', {
      name: character.name,
      role: character.role || 'unknown'
    });

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        project_id: projectId,
        name: character.name.trim(),
        category: 'character',
        subcategory: character.role || 'character',
        description: character.description || character.background || '',
        details: {
          traits: character.traits || [],
          goals: character.goals || character.motivations || '',
          relationships: character.relationships || []
        },
        confidence_score: character.ai_confidence || 0.8,
        relevance_score: 0.9,
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: character.ai_confidence || 0.8,
        evidence: character.evidence || '',
        reasoning: character.reasoning || ''
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to store character:', {
        character: character.name,
        error: error.message,
        details: error
      });
      throw new Error(`Failed to store character "${character.name}": ${error.message}`);
    }

    console.log('✅ Character stored successfully:', {
      id: data.id,
      name: data.name,
      category: data.category
    });
  }

  // Relationship storage with validation and error propagation
  private static async storeRelationship(projectId: string, relationship: any, sourceChapterIds: string[]) {
    if (!relationship.character_a_name || !relationship.character_b_name || !relationship.relationship_type) {
      console.error('❌ Invalid relationship - missing required fields:', relationship);
      throw new Error(`Relationship missing required fields: ${JSON.stringify(relationship)}`);
    }

    console.log('💞 Storing relationship:', {
      characterA: relationship.character_a_name,
      characterB: relationship.character_b_name,
      type: relationship.relationship_type
    });

    const { data, error } = await supabase
      .from('character_relationships')
      .insert({
        project_id: projectId,
        character_a_name: relationship.character_a_name.trim(),
        character_b_name: relationship.character_b_name.trim(),
        relationship_type: relationship.relationship_type.trim(),
        relationship_strength: relationship.relationship_strength || 1,
        relationship_current_status: relationship.relationship_current_status || 'active',
        confidence_score: relationship.ai_confidence || 0.7,
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: relationship.ai_confidence || 0.7,
        evidence: relationship.evidence || ''
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to store relationship:', {
        relationship: `${relationship.character_a_name} - ${relationship.character_b_name}`,
        error: error.message,
        details: error
      });
      throw new Error(`Failed to store relationship "${relationship.character_a_name} - ${relationship.character_b_name}": ${error.message}`);
    }

    console.log('✅ Relationship stored successfully:', {
      id: data.id,
      characterA: data.character_a_name,
      characterB: data.character_b_name,
      type: data.relationship_type
    });
  }

  // Timeline event storage with validation and error propagation
  private static async storeTimelineEvent(projectId: string, event: any, sourceChapterIds: string[]) {
    if (!event.event_name || typeof event.event_name !== 'string' || event.event_name.trim() === '') {
      console.error('❌ Invalid timeline event - missing or invalid name:', event);
      throw new Error(`Timeline event missing required name field: ${JSON.stringify(event)}`);
    }

    console.log('⏰ Storing timeline event:', {
      name: event.event_name,
      type: event.event_type || 'general'
    });

    const { data, error } = await supabase
      .from('timeline_events')
      .insert({
        project_id: projectId,
        event_name: event.event_name.trim(),
        event_type: event.event_type || 'general',
        event_summary: event.event_summary || event.description || '',
        characters_involved_names: event.characters_involved_names || [],
        confidence_score: event.ai_confidence || 0.7,
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: event.ai_confidence || 0.7,
        evidence: event.evidence || '',
        chronological_order: event.chronological_order || 0
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to store timeline event:', {
        event: event.event_name,
        error: error.message,
        details: error
      });
      throw new Error(`Failed to store timeline event "${event.event_name}": ${error.message}`);
    }

    console.log('✅ Timeline event stored successfully:', {
      id: data.id,
      name: data.event_name,
      type: data.event_type
    });
  }

  // Plot thread storage with validation and error propagation
  private static async storePlotThread(projectId: string, plotThread: any, sourceChapterIds: string[]) {
    if (!plotThread.thread_name || typeof plotThread.thread_name !== 'string' || plotThread.thread_name.trim() === '') {
      console.error('❌ Invalid plot thread - missing or invalid name:', plotThread);
      throw new Error(`Plot thread missing required name field: ${JSON.stringify(plotThread)}`);
    }

    console.log('🧵 Storing plot thread:', {
      name: plotThread.thread_name,
      type: plotThread.thread_type || 'general'
    });

    const { data, error } = await supabase
      .from('plot_threads')
      .insert({
        project_id: projectId,
        thread_name: plotThread.thread_name.trim(),
        thread_type: plotThread.thread_type || 'general',
        thread_status: plotThread.thread_status || 'active',
        key_events: plotThread.key_events || [],
        characters_involved_names: plotThread.characters_involved_names || [],
        confidence_score: plotThread.ai_confidence || 0.7,
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: plotThread.ai_confidence || 0.7,
        evidence: plotThread.evidence || ''
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to store plot thread:', {
        thread: plotThread.thread_name,
        error: error.message,
        details: error
      });
      throw new Error(`Failed to store plot thread "${plotThread.thread_name}": ${error.message}`);
    }

    console.log('✅ Plot thread stored successfully:', {
      id: data.id,
      name: data.thread_name,
      type: data.thread_type
    });
  }

  // Plot point storage with validation and error propagation
  private static async storePlotPoint(projectId: string, plotPoint: any, sourceChapterIds: string[]) {
    if (!plotPoint.name || typeof plotPoint.name !== 'string' || plotPoint.name.trim() === '') {
      console.error('❌ Invalid plot point - missing or invalid name:', plotPoint);
      throw new Error(`Plot point missing required name field: ${JSON.stringify(plotPoint)}`);
    }

    console.log('📍 Storing plot point:', {
      name: plotPoint.name,
      thread: plotPoint.plot_thread_name || 'general'
    });

    const { data, error } = await supabase
      .from('plot_points')
      .insert({
        project_id: projectId,
        name: plotPoint.name.trim(),
        description: plotPoint.description || '',
        plot_thread_name: plotPoint.plot_thread_name || 'general',
        significance: plotPoint.significance || '',
        characters_involved_names: plotPoint.characters_involved_names || [],
        ai_confidence: plotPoint.ai_confidence || 0.7,
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to store plot point:', {
        point: plotPoint.name,
        error: error.message,
        details: error
      });
      throw new Error(`Failed to store plot point "${plotPoint.name}": ${error.message}`);
    }

    console.log('✅ Plot point stored successfully:', {
      id: data.id,
      name: data.name,
      thread: data.plot_thread_name
    });
  }

  // Chapter summary storage with validation and error propagation
  private static async storeChapterSummary(projectId: string, summary: any, sourceChapters: any[]) {
    if (!summary.chapter_id || !summary.summary_text) {
      console.error('❌ Invalid chapter summary - missing required fields:', summary);
      throw new Error(`Chapter summary missing required fields: ${JSON.stringify(summary)}`);
    }

    console.log('📝 Storing chapter summary:', {
      chapterId: summary.chapter_id,
      hasText: !!summary.summary_text
    });

    const { data, error } = await supabase
      .from('chapter_summaries')
      .insert({
        project_id: projectId,
        chapter_id: summary.chapter_id,
        summary_text: summary.summary_text,
        key_events: summary.key_events || [],
        characters_mentioned: summary.characters_mentioned || [],
        ai_confidence: summary.ai_confidence || 0.8,
        is_newly_extracted: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to store chapter summary:', {
        chapterId: summary.chapter_id,
        error: error.message,
        details: error
      });
      throw new Error(`Failed to store chapter summary for chapter "${summary.chapter_id}": ${error.message}`);
    }

    console.log('✅ Chapter summary stored successfully:', {
      id: data.id,
      chapterId: data.chapter_id
    });
  }

  // Legacy placeholder methods for backward compatibility
  static async storeOrUpdateCharacter(projectId: string, character: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    console.log('Character storage not implemented in simplified version');
    return false;
  }

  static async storeOrUpdateRelationship(projectId: string, relationship: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    console.log('Relationship storage not implemented in simplified version');
    return false;
  }

  static async storeOrUpdatePlotThread(projectId: string, plotThread: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    console.log('Plot thread storage not implemented in simplified version');
    return false;
  }

  static async storeOrUpdateTimelineEvent(projectId: string, event: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    console.log('Timeline event storage not implemented in simplified version');
    return false;
  }

  static async storeOrUpdatePlotPoint(projectId: string, plotPoint: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    console.log('Plot point storage not implemented in simplified version');
    return false;
  }

  static async storeOrUpdateChapterSummary(projectId: string, summary: any, sourceChapters: any[], forceReExtraction: boolean = false) {
    console.log('Chapter summary storage not implemented in simplified version');
    return false;
  }

  // Missing methods needed by other components
  static async analyzeProject(projectId: string, options: any = {}): Promise<any> {
    console.log('🚀 Starting SmartAnalysisOrchestrator project analysis:', projectId);
    
    try {
      // Get all chapters for the project
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (chaptersError) {
        console.error('❌ Failed to fetch chapters:', chaptersError);
        throw chaptersError;
      }

      if (!chapters || chapters.length === 0) {
        console.log('ℹ️ No chapters found for project');
        return { success: true, message: 'No chapters to analyze' };
      }

      console.log(`📚 Found ${chapters.length} chapters to analyze`);

      // Call extract-knowledge function for gap analysis
      const { data: extractResult, error: extractError } = await supabase.functions.invoke('extract-knowledge', {
        body: {
          projectId,
          chapterId: 'gap-analysis',
          options: {
            extractionMode: 'gap_analysis',
            forceReExtraction: options.forceReExtraction || false,
            contentTypesToExtract: 'all'
          },
          freshContext: chapters.map(c => ({
            id: c.id,
            title: c.title,
            content: c.content || '',
            word_count: c.word_count || 0
          }))
        }
      });

      if (extractError) {
        console.error('❌ Extract-knowledge function failed:', extractError);
        throw extractError;
      }

      console.log('✅ Project analysis completed successfully:', extractResult);
      return { success: true, result: extractResult };

    } catch (error) {
      console.error('❌ SmartAnalysisOrchestrator.analyzeProject failed:', error);
      throw error;
    }
  }

  static async analyzeChapter(projectId: string, chapterId: string, onComplete?: () => void): Promise<void> {
    console.log('analyzeChapter not implemented in simplified version');
    if (onComplete) onComplete();
  }
}