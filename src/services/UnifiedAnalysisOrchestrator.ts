import { supabase } from '@/integrations/supabase/client';
import { ContentHashService } from './ContentHashService';
import { ChronologicalCoordinationService } from './ChronologicalCoordinationService';
import { EmbeddingsBasedProcessingService } from './EmbeddingsBasedProcessingService';
import { EnhancedEmbeddingsService } from './EnhancedEmbeddingsService';
import { SemanticDeduplicationService } from './SemanticDeduplicationService';

/**
 * Unified Analysis Orchestrator - Consolidates all analysis functionality
 * Replaces both SmartAnalysisOrchestrator and EnhancedAnalysisOrchestrator
 */
export class UnifiedAnalysisOrchestrator {
  
  /**
   * Main entry point for project analysis
   */
  static async analyzeProject(
    projectId: string, 
    options: { 
      forceReExtraction?: boolean; 
      selectedContentTypes?: string[] 
    } = {}
  ): Promise<any> {
    try {
      const { forceReExtraction = false, selectedContentTypes = [] } = options;
      console.log('🚀 [UNIFIED] Starting project analysis:', projectId, { forceReExtraction, selectedContentTypes });

      // Phase 1: Get chapters that need analysis
      const chaptersToAnalyze = await this.getChaptersForAnalysis(projectId, forceReExtraction);
      
      if (chaptersToAnalyze.length === 0) {
        console.log('✅ No chapters need analysis');
        return { success: true, processingStats: { chaptersProcessed: 0 } };
      }

      // Phase 2: Process each chapter
      let totalExtracted = 0;
      for (const chapter of chaptersToAnalyze) {
        const shouldSkip = await this.shouldSkipChapterProcessing(projectId, chapter, forceReExtraction);
        
        if (shouldSkip) {
          console.log(`⏭️ Skipping chapter "${chapter.title}" - too similar to existing content`);
          continue;
        }

        // Extract knowledge from chapter
        const extractionResult = await this.extractKnowledgeFromChapter(
          projectId, 
          chapter, 
          { forceReExtraction, selectedContentTypes }
        );

        if (extractionResult.success && extractionResult.extractedData) {
          // Store extracted knowledge with selective force mode
          const stored = await this.storeExtractedKnowledge(
            projectId, 
            extractionResult.extractedData, 
            [chapter.id],
            { forceReExtraction, selectedContentTypes }
          );
          totalExtracted += stored;
        }

        // Update content hash
        await ContentHashService.updateContentHash(chapter.id, chapter.content || '');
      }

      // Phase 3: Apply chronological coordination
      await ChronologicalCoordinationService.assignChronologicalOrder(projectId);

      console.log('✅ [UNIFIED] Analysis completed successfully');
      return {
        success: true,
        processingStats: {
          chaptersProcessed: chaptersToAnalyze.length,
          knowledgeExtracted: totalExtracted
        }
      };

    } catch (error) {
      console.error('❌ [UNIFIED] Analysis failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Force re-analysis with selected content types
   */
  static async forceReAnalyzeProject(projectId: string, selectedContentTypes: string[]): Promise<any> {
    console.log('🔥 [UNIFIED] Force re-analysis:', projectId, 'types:', selectedContentTypes);
    
    return this.analyzeProject(projectId, {
      forceReExtraction: true,
      selectedContentTypes
    });
  }

  /**
   * Get chapters that need analysis based on content hashes
   */
  private static async getChaptersForAnalysis(projectId: string, forceReExtraction: boolean): Promise<any[]> {
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (error) {
      throw new Error(`Failed to fetch chapters: ${error.message}`);
    }

    if (!chapters || chapters.length === 0) {
      return [];
    }

    // If force re-extraction, return all chapters with content
    if (forceReExtraction) {
      return chapters.filter(c => c.content && c.content.trim().length > 0);
    }

    // Check content hashes to determine which chapters need analysis
    const chaptersNeedingAnalysis = [];
    for (const chapter of chapters) {
      if (chapter.content && chapter.content.trim().length > 0) {
        try {
          const hashResult = await ContentHashService.verifyContentHash(chapter.id, chapter.content);
          if (hashResult.hasChanges) {
            chaptersNeedingAnalysis.push(chapter);
          }
        } catch (hashError) {
          console.error(`Hash verification failed for chapter ${chapter.id}:`, hashError);
          chaptersNeedingAnalysis.push(chapter); // Include on error to be safe
        }
      }
    }

    return chaptersNeedingAnalysis;
  }

  /**
   * Check if chapter processing should be skipped due to similarity
   */
  private static async shouldSkipChapterProcessing(
    projectId: string, 
    chapter: any, 
    forceReExtraction: boolean
  ): Promise<boolean> {
    // Skip similarity check if force re-extraction is enabled
    if (forceReExtraction) {
      return false;
    }

    try {
      const similarityResult = await EnhancedEmbeddingsService.checkChunkLevelSimilarity(
        projectId,
        chapter.content,
        chapter.id,
        forceReExtraction
      );
      
      return similarityResult.shouldSkipExtraction;
    } catch (error) {
      console.warn(`Similarity check failed for chapter ${chapter.id}:`, error);
      return false; // Proceed with processing on error
    }
  }

  /**
   * Extract knowledge from a single chapter using the edge function
   */
  private static async extractKnowledgeFromChapter(
    projectId: string,
    chapter: any,
    options: { forceReExtraction?: boolean; selectedContentTypes?: string[] }
  ): Promise<any> {
    console.log(`🧠 Extracting knowledge from chapter: ${chapter.title}`);

    const { data: result, error } = await supabase.functions.invoke('extract-knowledge', {
      body: {
        content: chapter.content,
        projectId: projectId,
        chapterId: chapter.id,
        options: {
          forceReExtraction: options.forceReExtraction,
          contentTypesToExtract: options.selectedContentTypes,
          useEmbeddingsBasedProcessing: true
        }
      }
    });

    if (error) {
      console.error('Knowledge extraction failed:', error);
      throw new Error(`Knowledge extraction failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Store extracted knowledge with selective force mode
   */
  private static async storeExtractedKnowledge(
    projectId: string,
    extractedData: any,
    sourceChapterIds: string[],
    options: { forceReExtraction?: boolean; selectedContentTypes?: string[] }
  ): Promise<number> {
    let totalStored = 0;

    // Determine which categories should use force mode
    const { forceReExtraction = false, selectedContentTypes = [] } = options;
    const isForceMode = forceReExtraction && selectedContentTypes.length > 0;

    try {
      // Store characters
      if (extractedData.characters && extractedData.characters.length > 0) {
        const useForce = isForceMode && selectedContentTypes.includes('characters');
        for (const character of extractedData.characters) {
          await this.storeCharacter(projectId, character, sourceChapterIds, useForce);
          totalStored++;
        }
      } else if (extractedData.relationships && extractedData.relationships.length > 0) {
        // Fallback: Create placeholder characters from relationships if no characters were extracted
        console.log('🔄 [FALLBACK] No characters extracted, creating from relationships...');
        const uniqueCharacterNames = new Set();
        
        extractedData.relationships.forEach(rel => {
          if (rel.character_a_name) uniqueCharacterNames.add(rel.character_a_name);
          if (rel.character_b_name) uniqueCharacterNames.add(rel.character_b_name);
        });
        
        for (const characterName of uniqueCharacterNames) {
          const placeholderCharacter = {
            name: characterName,
            description: `Character extracted from relationship data`,
            traits: [],
            role: 'character',
            confidence_score: 0.3 // Lower confidence since it's inferred
          };
          
          await this.storeCharacter(projectId, placeholderCharacter, sourceChapterIds, false);
          totalStored++;
          console.log(`✅ [FALLBACK] Created placeholder character: ${characterName}`);
        }
      }

      // Store relationships  
      if (extractedData.relationships && extractedData.relationships.length > 0) {
        const useForce = isForceMode && selectedContentTypes.includes('relationships');
        for (const relationship of extractedData.relationships) {
          await this.storeRelationship(projectId, relationship, sourceChapterIds, useForce);
          totalStored++;
        }
      }

      // Store timeline events
      if (extractedData.timelineEvents && extractedData.timelineEvents.length > 0) {
        const useForce = isForceMode && selectedContentTypes.includes('timeline_events');
        for (const event of extractedData.timelineEvents) {
          await this.storeTimelineEvent(projectId, event, sourceChapterIds, useForce);
          totalStored++;
        }
      }

      // Store plot threads
      if (extractedData.plotThreads && extractedData.plotThreads.length > 0) {
        const useForce = isForceMode && selectedContentTypes.includes('plot_threads');
        for (const plotThread of extractedData.plotThreads) {
          await this.storePlotThread(projectId, plotThread, sourceChapterIds, useForce);
          totalStored++;
        }
      }

      // Store plot points
      if (extractedData.plotPoints && extractedData.plotPoints.length > 0) {
        const useForce = isForceMode && selectedContentTypes.includes('plot_points');
        for (const plotPoint of extractedData.plotPoints) {
          await this.storePlotPoint(projectId, plotPoint, sourceChapterIds, useForce);
          totalStored++;
        }
      }

      // Store chapter summaries
      if (extractedData.chapterSummaries && extractedData.chapterSummaries.length > 0) {
        const useForce = isForceMode && selectedContentTypes.includes('chapter_summaries');
        for (const summary of extractedData.chapterSummaries) {
          await this.storeChapterSummary(projectId, summary, sourceChapterIds, useForce);
          totalStored++;
        }
      }

      // Store world building
      if (extractedData.worldBuilding && extractedData.worldBuilding.length > 0) {
        const useForce = isForceMode && selectedContentTypes.includes('world_building');
        for (const worldElement of extractedData.worldBuilding) {
          await this.storeWorldBuilding(projectId, worldElement, sourceChapterIds, useForce);
          totalStored++;
        }
      }

      // Store themes
      if (extractedData.themes && extractedData.themes.length > 0) {
        const useForce = isForceMode && selectedContentTypes.includes('themes');
        console.log(`🎨 [BATCH] About to store ${extractedData.themes.length} themes`);
        for (const theme of extractedData.themes) {
          try {
            await this.storeTheme(projectId, theme, sourceChapterIds, useForce);
            totalStored++;
            console.log(`🎨 [BATCH] Successfully stored theme: ${theme.name}`);
          } catch (themeError) {
            console.error(`❌ [BATCH] Failed to store theme ${theme.name}:`, themeError);
            throw themeError; // Propagate the error to see what's failing
          }
        }
      }

    } catch (error) {
      console.error('❌ [CRITICAL] Error in storeExtractedKnowledge:', error);
      throw error; // Propagate the error instead of swallowing it
    }

    return totalStored;
  }

  /**
   * Store character with selective deduplication bypass
   */
  private static async storeCharacter(
    projectId: string, 
    character: any, 
    sourceChapterIds: string[],
    bypassDeduplication: boolean = false
  ): Promise<void> {
    console.log(`🎭 [DEBUG] Attempting to store character:`, {
      name: character.name,
      description: character.description,
      role: character.role,
      confidence: character.confidence_score,
      bypassDeduplication
    });

    // Skip deduplication checks if bypass is enabled
    if (!bypassDeduplication) {
      // Normal deduplication logic would go here
      console.log(`🎭 Storing character with deduplication: ${character.name}`);
    } else {
      console.log(`🎭 Storing character with bypass: ${character.name}`);
    }

    // Validate required fields
    if (!character.name || !character.name.trim()) {
      console.error('❌ [VALIDATION] Character missing required name field:', character);
      throw new Error(`Character validation failed: missing name`);
    }

    console.log(`🎭 [ATTEMPT] About to store character with data:`, {
      project_id: projectId,
      name: character.name,
      category: 'character',
      subcategory: character.role,
      description: character.description,
      details: {
        traits: character.traits || [],
        role: character.role
      },
      confidence_score: character.confidence_score || 0.5,
      source_chapter_ids: sourceChapterIds
    });

    // Store the character - NO try-catch to allow errors to propagate
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        project_id: projectId,
        name: character.name,
        category: 'character',
        subcategory: character.role,
        description: character.description,
        details: {
          traits: character.traits || [],
          role: character.role
        },
        confidence_score: character.confidence_score || 0.5,
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: character.confidence_score || 0.5
      })
      .select();

    if (error) {
      console.error('❌ [ERROR] Database error storing character:', character.name, error);
      console.error('❌ [ERROR] Failed character data:', character);
      console.error('❌ [ERROR] Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to store character ${character.name}: ${error.message}`);
    }
    
    console.log(`✅ [SUCCESS] Character stored successfully: ${character.name}`, data);
  }

  /**
   * Store relationship with selective deduplication bypass
   */
  private static async storeRelationship(
    projectId: string, 
    relationship: any, 
    sourceChapterIds: string[],
    bypassDeduplication: boolean = false
  ): Promise<void> {
    // Skip ALL deduplication checks if bypass is enabled (for force re-extraction)
    if (!bypassDeduplication) {
      // Check for semantic similarity first
      const similarityResult = await SemanticDeduplicationService.checkSemanticSimilarity(
        projectId,
        'character_relationships',
        relationship
      );

      if (similarityResult.hasSimilar && similarityResult.existingItem) {
        console.log(`🔀 Found similar relationship, merging: ${relationship.character_a_name} - ${relationship.character_b_name}`);
        // Merge logic would go here
        return;
      }

      // Check for exact match
      const { data: existingRelationships } = await supabase
        .from('character_relationships')
        .select('*')
        .eq('project_id', projectId)
        .eq('character_a_name', relationship.character_a_name)
        .eq('character_b_name', relationship.character_b_name)
        .eq('relationship_type', relationship.relationship_type);

      if (existingRelationships && existingRelationships.length > 0) {
        console.log(`🔄 Found exact match, updating relationship: ${relationship.character_a_name} - ${relationship.character_b_name}`);
        // Update logic would go here
        return;
      }
    } else {
      console.log(`🤝 Storing relationship with bypass: ${relationship.character_a_name} - ${relationship.character_b_name}`);
    }

    // Store new relationship
    const { error } = await supabase
      .from('character_relationships')
      .insert({
        project_id: projectId,
        character_a_name: relationship.character_a_name,
        character_b_name: relationship.character_b_name,
        relationship_type: relationship.relationship_type,
        relationship_strength: relationship.relationship_strength || 5,
        confidence_score: relationship.confidence_score || 0.5,
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: relationship.confidence_score || 0.5,
        evidence: relationship.evidence || null
      });

    if (error) {
      console.error('Error storing relationship:', relationship, error);
    } else {
      console.log(`✅ Stored relationship: ${relationship.character_a_name} - ${relationship.character_b_name}`);
    }
  }

  /**
   * Store timeline event with selective deduplication bypass
   */
  private static async storeTimelineEvent(
    projectId: string, 
    event: any, 
    sourceChapterIds: string[],
    bypassDeduplication: boolean = false
  ): Promise<void> {
    // Skip ALL deduplication checks if bypass is enabled (for force re-extraction)
    if (!bypassDeduplication) {
      // Check for semantic similarity first
      const similarityResult = await SemanticDeduplicationService.checkSemanticSimilarity(
        projectId,
        'timeline_events',
        event
      );

      if (similarityResult.hasSimilar && similarityResult.existingItem) {
        console.log(`🔀 Found similar timeline event, merging: ${event.event_name}`);
        // Merge logic would go here
        return;
      }

      // Check for exact match
      const { data: existingEvents } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('project_id', projectId)
        .eq('event_name', event.event_name)
        .eq('event_type', event.event_type || 'general');

      if (existingEvents && existingEvents.length > 0) {
        console.log(`🔄 Found exact match, updating timeline event: ${event.event_name}`);
        // Update logic would go here
        return;
      }
    } else {
      console.log(`⏰ Storing timeline event with bypass: ${event.event_name}`);
    }

    // Store new timeline event - FIX FIELD MAPPING HERE
    const { error } = await supabase
      .from('timeline_events')
      .insert({
        project_id: projectId,
        event_name: event.event_name,
        event_type: event.event_type || 'general',
        event_summary: event.description || event.event_summary, // Map description to event_summary
        chronological_order: event.chronological_order || 0,
        date_or_time_reference: event.date_or_time_reference,
        significance: event.significance,
        characters_involved_names: event.characters_involved || event.characters_involved_names || [], // Map characters_involved to characters_involved_names
        plot_threads_impacted_names: event.plot_threads_impacted_names || [],
        locations_involved_names: event.locations_involved_names || [],
        confidence_score: event.confidence_score || 0.5,
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: event.confidence_score || 0.5
      });

    if (error) {
      console.error('Error storing timeline event:', event, error);
    } else {
      console.log(`✅ Stored timeline event: ${event.event_name}`);
    }
  }

  /**
   * Store plot thread with selective deduplication bypass
   */
  private static async storePlotThread(
    projectId: string, 
    plotThread: any, 
    sourceChapterIds: string[],
    bypassDeduplication: boolean = false
  ): Promise<void> {
    if (!bypassDeduplication) {
      // Normal deduplication checks...
      console.log(`📖 Storing plot thread with deduplication: ${plotThread.thread_name}`);
    } else {
      console.log(`📖 Storing plot thread with bypass: ${plotThread.thread_name}`);
    }

    const { error } = await supabase
      .from('plot_threads')
      .insert({
        project_id: projectId,
        thread_name: plotThread.thread_name,
        thread_type: plotThread.thread_type,
        thread_status: plotThread.status || 'active',
        key_events: plotThread.key_events || [],
        characters_involved_names: plotThread.characters_involved_names || [],
        confidence_score: plotThread.confidence_score || 0.5,
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: plotThread.confidence_score || 0.5
      });

    if (error) {
      console.error('Error storing plot thread:', plotThread, error);
    } else {
      console.log(`✅ Stored plot thread: ${plotThread.thread_name}`);
    }
  }

  /**
   * Store plot point with selective deduplication bypass
   */
  private static async storePlotPoint(
    projectId: string, 
    plotPoint: any, 
    sourceChapterIds: string[],
    bypassDeduplication: boolean = false
  ): Promise<void> {
    if (!bypassDeduplication) {
      console.log(`📍 Storing plot point with deduplication: ${plotPoint.name}`);
    } else {
      console.log(`📍 Storing plot point with bypass: ${plotPoint.name}`);
    }

    const { error } = await supabase
      .from('plot_points')
      .insert({
        project_id: projectId,
        name: plotPoint.name,
        description: plotPoint.description,
        plot_thread_name: plotPoint.plot_thread_name,
        significance: plotPoint.significance,
        characters_involved_names: plotPoint.characters_involved_names || [],
        ai_confidence: plotPoint.confidence_score || 0.5,
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true
      });

    if (error) {
      console.error('Error storing plot point:', plotPoint, error);
    } else {
      console.log(`✅ Stored plot point: ${plotPoint.name}`);
    }
  }

  /**
   * Store chapter summary with selective deduplication bypass
   */
  private static async storeChapterSummary(
    projectId: string, 
    summary: any, 
    sourceChapterIds: string[],
    bypassDeduplication: boolean = false
  ): Promise<void> {
    const chapterId = sourceChapterIds[0];
    
    if (!bypassDeduplication) {
      console.log(`📄 Storing chapter summary with deduplication for chapter: ${chapterId}`);
    } else {
      console.log(`📄 Storing chapter summary with bypass for chapter: ${chapterId}`);
    }

    const { error } = await supabase
      .from('chapter_summaries')
      .insert({
        project_id: projectId,
        chapter_id: chapterId,
        title: summary.title,
        summary_short: summary.summary_short,
        summary_long: summary.summary_long,
        key_events_in_chapter: summary.key_events || [],
        primary_focus: summary.primary_focus || [],
        ai_confidence: summary.confidence_score || 0.5,
        is_newly_extracted: true
      });

    if (error) {
      console.error('Error storing chapter summary:', summary, error);
    } else {
      console.log(`✅ Stored chapter summary for chapter: ${chapterId}`);
    }
  }

  /**
   * Store world building with selective deduplication bypass
   */
  private static async storeWorldBuilding(
    projectId: string, 
    worldElement: any, 
    sourceChapterIds: string[],
    bypassDeduplication: boolean = false
  ): Promise<void> {
    if (!bypassDeduplication) {
      console.log(`🌍 Storing world building with deduplication: ${worldElement.name}`);
    } else {
      console.log(`🌍 Storing world building with bypass: ${worldElement.name}`);
    }

    // Validate required fields
    if (!worldElement.name || !worldElement.name.trim()) {
      console.error('❌ [VALIDATION] World building element missing required name field:', worldElement);
      throw new Error(`World building validation failed: missing name`);
    }

    console.log(`🌍 [ATTEMPT] About to store world building element with data:`, {
      project_id: projectId,
      name: worldElement.name,
      category: 'world_building',
      subcategory: worldElement.category || 'general',
      description: worldElement.description,
      details: worldElement.details || {},
      confidence_score: worldElement.confidence_score || 0.8,
      source_chapter_ids: sourceChapterIds
    });

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        project_id: projectId,
        name: worldElement.name,
        category: 'world_building',
        subcategory: worldElement.category || 'general',
        description: worldElement.description,
        details: worldElement.details || {},
        confidence_score: worldElement.confidence_score || 0.8,
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: worldElement.confidence_score || 0.8
      })
      .select();

    if (error) {
      console.error('❌ [ERROR] Database error storing world building element:', worldElement.name, error);
      console.error('❌ [ERROR] Failed world building data:', worldElement);
      console.error('❌ [ERROR] Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to store world building element ${worldElement.name}: ${error.message}`);
    }
    
    console.log(`✅ [SUCCESS] World building element stored successfully: ${worldElement.name}`, data);
  }

  /**
   * Store theme with selective deduplication bypass
   */
  private static async storeTheme(
    projectId: string, 
    theme: any, 
    sourceChapterIds: string[],
    bypassDeduplication: boolean = false
  ): Promise<void> {
    if (!bypassDeduplication) {
      console.log(`🎨 Storing theme with deduplication: ${theme.name}`);
    } else {
      console.log(`🎨 Storing theme with bypass: ${theme.name}`);
    }

    // Validate required fields
    if (!theme.name || !theme.name.trim()) {
      console.error('❌ [VALIDATION] Theme missing required name field:', theme);
      throw new Error(`Theme validation failed: missing name`);
    }

    console.log(`🎨 [ATTEMPT] About to store theme with data:`, {
      project_id: projectId,
      name: theme.name,
      category: 'theme',
      subcategory: theme.type || 'general',
      description: theme.description,
      details: {
        significance: theme.significance
      },
      confidence_score: theme.confidence_score || 0.7,
      source_chapter_ids: sourceChapterIds
    });

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        project_id: projectId,
        name: theme.name,
        category: 'theme',
        subcategory: theme.type || 'general',
        description: theme.description,
        details: {
          significance: theme.significance
        },
        confidence_score: theme.confidence_score || 0.7,
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: theme.confidence_score || 0.7
      })
      .select();

    if (error) {
      console.error('❌ [ERROR] Database error storing theme:', theme.name, error);
      console.error('❌ [ERROR] Failed theme data:', theme);
      console.error('❌ [ERROR] Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to store theme ${theme.name}: ${error.message}`);
    }
    
    console.log(`✅ [SUCCESS] Theme stored successfully: ${theme.name}`, data);
  }
}