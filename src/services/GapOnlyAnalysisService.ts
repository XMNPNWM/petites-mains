import { supabase } from '@/integrations/supabase/client';

interface GapDetectionResult {
  relationships: boolean;
  timelineEvents: boolean;
  plotThreads: boolean;
  chapterSummaries: boolean;
  worldBuilding: boolean;
  themes: boolean;
}

interface GapAnalysisResult {
  success: boolean;
  totalExtracted: number;
  gapsDetected: GapDetectionResult;
  gapsFilled: string[];
  error?: string;
}

/**
 * Independent Gap-Only Analysis Service
 * Operates separately from main analysis pipeline to surgically fill empty categories
 */
export class GapOnlyAnalysisService {
  
  /**
   * Phase 1: Lightweight gap detection across entire project
   */
  static async detectEmptyCategories(projectId: string): Promise<GapDetectionResult> {
    console.log('🔍 Detecting empty categories for project:', projectId);
    
    try {
      const [
        relationshipsCount,
        timelineEventsCount,
        plotThreadsCount,
        chapterSummariesCount,
        worldBuildingCount,
        themesCount
      ] = await Promise.all([
        supabase.from('character_relationships').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('timeline_events').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('plot_threads').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('chapter_summaries').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('category', 'world_building'),
        supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('category', 'theme')
      ]);

      const gaps = {
        relationships: (relationshipsCount.count || 0) === 0,
        timelineEvents: (timelineEventsCount.count || 0) === 0,
        plotThreads: (plotThreadsCount.count || 0) === 0,
        chapterSummaries: (chapterSummariesCount.count || 0) === 0,
        worldBuilding: (worldBuildingCount.count || 0) === 0,
        themes: (themesCount.count || 0) === 0
      };

      console.log('📊 Gap detection results:', gaps);
      return gaps;
    } catch (error) {
      console.error('❌ Error detecting gaps:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Focused extraction for empty categories only
   */
  static async fillCategoryGaps(projectId: string, gaps: GapDetectionResult): Promise<GapAnalysisResult> {
    console.log('🎯 Starting gap-only extraction for project:', projectId);
    
    try {
      // Get all chapters with content
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, title, content')
        .eq('project_id', projectId)
        .not('content', 'is', null)
        .neq('content', '');

      if (chaptersError) {
        throw new Error(`Failed to fetch chapters: ${chaptersError.message}`);
      }

      if (!chapters || chapters.length === 0) {
        return {
          success: true,
          totalExtracted: 0,
          gapsDetected: gaps,
          gapsFilled: []
        };
      }

      // Identify which categories need extraction
      const emptyCategories = Object.entries(gaps)
        .filter(([_, isEmpty]) => isEmpty)
        .map(([category, _]) => category);

      if (emptyCategories.length === 0) {
        console.log('✅ No gaps detected, skipping extraction');
        return {
          success: true,
          totalExtracted: 0,
          gapsDetected: gaps,
          gapsFilled: []
        };
      }

      console.log('🎯 Extracting data for empty categories:', emptyCategories);

      let totalExtracted = 0;
      const gapsFilled: string[] = [];

      // Process chapters sequentially to avoid overwhelming the edge function
      for (const chapter of chapters) {
        console.log(`📖 Processing chapter for gaps: ${chapter.title}`);
        
        const extractionResult = await this.extractForEmptyCategories(
          chapter,
          projectId,
          emptyCategories
        );

        if (extractionResult.success) {
          totalExtracted += extractionResult.extractedCount;
          extractionResult.categoriesFilled.forEach(category => {
            if (!gapsFilled.includes(category)) {
              gapsFilled.push(category);
            }
          });
        }
      }

      console.log(`✅ Gap extraction complete. Total extracted: ${totalExtracted}, Categories filled: ${gapsFilled}`);

      return {
        success: true,
        totalExtracted,
        gapsDetected: gaps,
        gapsFilled
      };

    } catch (error) {
      console.error('❌ Gap extraction failed:', error);
      return {
        success: false,
        totalExtracted: 0,
        gapsDetected: gaps,
        gapsFilled: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract data only for specified empty categories
   */
  private static async extractForEmptyCategories(
    chapter: { id: string; title: string; content: string },
    projectId: string,
    emptyCategories: string[]
  ): Promise<{ success: boolean; extractedCount: number; categoriesFilled: string[] }> {
    
    try {
      // Create focused extraction request for only empty categories
      const extractionTypes = emptyCategories.map(category => {
        switch (category) {
          case 'relationships': return 'character_relationships';
          case 'timelineEvents': return 'timeline_events';
          case 'plotThreads': return 'plot_threads';
          case 'chapterSummaries': return 'chapter_summaries';
          case 'worldBuilding': return 'world_building';
          case 'themes': return 'themes';
          default: return category;
        }
      });

      console.log(`🤖 Calling edge function for chapter ${chapter.title}, categories: ${extractionTypes}`);

      const { data: result, error } = await supabase.functions.invoke('extract-knowledge', {
        body: {
          projectId,
          chapterId: chapter.id,
          content: chapter.content,
          mode: 'gap_fill_only',
          targetCategories: extractionTypes
        }
      });

      if (error) {
        console.error(`❌ Edge function error for chapter ${chapter.title}:`, error);
        return { success: false, extractedCount: 0, categoriesFilled: [] };
      }

      if (!result || !result.success) {
        console.error(`❌ Extraction failed for chapter ${chapter.title}:`, result?.error);
        return { success: false, extractedCount: 0, categoriesFilled: [] };
      }

      console.log(`✅ Edge function returned:`, result);

      // **CRITICAL FIX: Actually store the extracted data to the database**
      const storageResult = await this.storeExtractedData(result.extractedData, projectId, chapter.id);
      
      console.log(`💾 Stored ${storageResult.totalStored} items to database from chapter ${chapter.title}`);

      return {
        success: true,
        extractedCount: storageResult.totalStored,
        categoriesFilled: storageResult.categoriesStored
      };

    } catch (error) {
      console.error(`❌ Error processing chapter ${chapter.title}:`, error);
      return { success: false, extractedCount: 0, categoriesFilled: [] };
    }
  }

  /**
   * Store extracted data to the database with proper field mapping
   */
  private static async storeExtractedData(
    extractedData: any,
    projectId: string,
    chapterId: string
  ): Promise<{ totalStored: number; categoriesStored: string[] }> {
    
    let totalStored = 0;
    const categoriesStored: string[] = [];

    try {
      // Store character relationships with enhanced validation
      if (extractedData.relationships && extractedData.relationships.length > 0) {
        console.log(`💾 Storing ${extractedData.relationships.length} relationships...`);
        
        // **ENHANCED: Validate relationships before storing**
        const validRelationships = extractedData.relationships.filter((rel: any) => {
          const isValid = rel.character_a_name && 
                         rel.character_b_name && 
                         rel.relationship_type &&
                         rel.character_a_name !== rel.character_b_name;
          
          if (!isValid) {
            console.log('⚠️ Skipping invalid relationship:', rel);
          }
          return isValid;
        });
        
        if (validRelationships.length > 0) {
          const relationshipsToStore = validRelationships.map((rel: any) => ({
            project_id: projectId,
            character_a_name: rel.character_a_name,
            character_b_name: rel.character_b_name,
            relationship_type: rel.relationship_type,
            relationship_strength: rel.relationship_strength || 5,
            ai_confidence_new: rel.confidence_score || 0.5,
            source_chapter_ids: [chapterId],
            is_newly_extracted: true,
            extraction_method: 'llm_direct'
          }));

          console.log('📋 Preparing to store relationships:', relationshipsToStore.map(r => 
            `${r.character_a_name} -> ${r.character_b_name} (${r.relationship_type})`
          ));

          const { data: relationshipsData, error: relationshipsError } = await supabase
            .from('character_relationships')
            .insert(relationshipsToStore)
            .select();

          if (!relationshipsError && relationshipsData) {
            totalStored += relationshipsData.length;
            categoriesStored.push('relationships');
            console.log(`✅ Successfully stored ${relationshipsData.length} relationships`);
            
            // Log each stored relationship for verification
            relationshipsData.forEach((rel: any, index: number) => {
              console.log(`   ${index + 1}. ${rel.character_a_name} -> ${rel.character_b_name} (${rel.relationship_type}) [ID: ${rel.id}]`);
            });
          } else {
            console.error('❌ Failed to store relationships:', relationshipsError);
            console.error('❌ Attempted to store:', relationshipsToStore);
          }
        } else {
          console.log('⚠️ No valid relationships to store after filtering');
        }
      } else {
        console.log('ℹ️ No relationships found in extracted data');
      }

      // Store timeline events with correct field mapping
      if (extractedData.timelineEvents && extractedData.timelineEvents.length > 0) {
        console.log(`💾 Storing ${extractedData.timelineEvents.length} timeline events...`);
        
        const timelineToStore = extractedData.timelineEvents.map((event: any) => ({
          project_id: projectId,
          event_name: event.event_name,
          event_type: event.event_type,
          event_description: event.event_summary, // **CRITICAL FIX: Map event_summary to event_description**
          chronological_order: event.chronological_order || 0,
          characters_involved_names: event.characters_involved_names || [],
          ai_confidence_new: event.confidence_score || 0.5,
          source_chapter_ids: [chapterId],
          is_newly_extracted: true,
          extraction_method: 'llm_direct'
        }));

        const { data: timelineData, error: timelineError } = await supabase
          .from('timeline_events')
          .insert(timelineToStore)
          .select();

        if (!timelineError && timelineData) {
          totalStored += timelineData.length;
          categoriesStored.push('timelineEvents');
          console.log(`✅ Stored ${timelineData.length} timeline events`);
        } else {
          console.error('❌ Failed to store timeline events:', timelineError);
        }
      }

      // Store plot threads
      if (extractedData.plotThreads && extractedData.plotThreads.length > 0) {
        console.log(`💾 Storing ${extractedData.plotThreads.length} plot threads...`);
        
        const plotThreadsToStore = extractedData.plotThreads.map((thread: any) => ({
          project_id: projectId,
          thread_name: thread.thread_name,
          thread_type: thread.thread_type,
          key_events: thread.key_events || [],
          thread_status: thread.status || 'active',
          ai_confidence_new: thread.confidence_score || 0.5,
          source_chapter_ids: [chapterId],
          is_newly_extracted: true,
          extraction_method: 'llm_direct'
        }));

        const { data: plotThreadsData, error: plotThreadsError } = await supabase
          .from('plot_threads')
          .insert(plotThreadsToStore)
          .select();

        if (!plotThreadsError && plotThreadsData) {
          totalStored += plotThreadsData.length;
          categoriesStored.push('plotThreads');
          console.log(`✅ Stored ${plotThreadsData.length} plot threads`);
        } else {
          console.error('❌ Failed to store plot threads:', plotThreadsError);
        }
      }

      console.log(`💾 Storage complete: ${totalStored} items stored across ${categoriesStored.length} categories`);
      
      return { totalStored, categoriesStored };

    } catch (error) {
      console.error('❌ Error storing extracted data:', error);
      return { totalStored: 0, categoriesStored: [] };
    }
  }

  /**
   * Main entry point for gap-only analysis
   */
  static async executeGapAnalysis(projectId: string): Promise<GapAnalysisResult> {
    console.log('🚀 Starting gap-only analysis for project:', projectId);

    // Phase 1: Detect gaps
    const gaps = await this.detectEmptyCategories(projectId);
    
    // Phase 2: Fill gaps if any exist
    return await this.fillCategoryGaps(projectId, gaps);
  }
}