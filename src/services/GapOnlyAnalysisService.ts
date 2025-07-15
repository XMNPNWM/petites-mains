import { supabase } from '@/integrations/supabase/client';

interface GapDetectionResult {
  relationships: boolean;
  timelineEvents: boolean;
  plotThreads: boolean;
  chapterSummaries: boolean;
  worldBuilding: boolean;
  themes: boolean;
}

interface DependencyAnalysisPlan {
  emptyCategories: string[];
  requiredDependencies: string[];
  categoriesToAnalyze: string[];
  categoriesToStore: string[];
}

interface GapAnalysisResult {
  success: boolean;
  totalExtracted: number;
  gapsDetected: GapDetectionResult;
  gapsFilled: string[];
  dependencyPlan?: DependencyAnalysisPlan;
  error?: string;
}

/**
 * Independent Gap-Only Analysis Service
 * Operates separately from main analysis pipeline to surgically fill empty categories
 */
export class GapOnlyAnalysisService {
  
  /**
   * Dependency mapping system for categories
   */
  private static getCategoryDependencies(): Record<string, string[]> {
    return {
      relationships: ['characters'], // Relationships need character context
      timelineEvents: [], // Standalone but benefits from character context
      plotThreads: ['characters'], // Benefits from character + timeline context
      plotPoints: ['plotThreads'], // Benefits from plot_threads context
      chapterSummaries: [], // Standalone
      worldBuilding: [], // Standalone
      themes: [] // Standalone
    };
  }

  /**
   * Create comprehensive analysis plan with dependencies
   */
  private static createDependencyAnalysisPlan(gaps: GapDetectionResult): DependencyAnalysisPlan {
    const emptyCategories = Object.entries(gaps)
      .filter(([_, isEmpty]) => isEmpty)
      .map(([category]) => category);

    const dependencies = this.getCategoryDependencies();
    const requiredDependencies = new Set<string>();

    // Find all dependencies for empty categories
    emptyCategories.forEach(category => {
      const deps = dependencies[category] || [];
      deps.forEach(dep => requiredDependencies.add(dep));
    });

    const categoriesToAnalyze = [
      ...emptyCategories,
      ...Array.from(requiredDependencies)
    ];

    const plan: DependencyAnalysisPlan = {
      emptyCategories,
      requiredDependencies: Array.from(requiredDependencies),
      categoriesToAnalyze,
      categoriesToStore: emptyCategories // Only store results for originally empty categories
    };

    console.log('🎯 [DEPENDENCY PLAN]:', {
      emptyCategories: plan.emptyCategories,
      requiredDependencies: plan.requiredDependencies,
      toAnalyze: plan.categoriesToAnalyze,
      toStore: plan.categoriesToStore
    });

    return plan;
  }

  /**
   * Phase 1: Lightweight gap detection across entire project
   */
  static async detectEmptyCategories(projectId: string): Promise<GapDetectionResult> {
    console.log('🔍 [GAP DETECTION] Starting for project:', projectId);
    
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

      // Log individual query results
      console.log('🔢 [GAP DETECTION] Raw counts:', {
        relationships: { count: relationshipsCount.count, error: relationshipsCount.error },
        timelineEvents: { count: timelineEventsCount.count, error: timelineEventsCount.error },
        plotThreads: { count: plotThreadsCount.count, error: plotThreadsCount.error },
        chapterSummaries: { count: chapterSummariesCount.count, error: chapterSummariesCount.error },
        worldBuilding: { count: worldBuildingCount.count, error: worldBuildingCount.error },
        themes: { count: themesCount.count, error: themesCount.error }
      });

      const gaps = {
        relationships: (relationshipsCount.count || 0) === 0,
        timelineEvents: (timelineEventsCount.count || 0) === 0,
        plotThreads: (plotThreadsCount.count || 0) === 0,
        chapterSummaries: (chapterSummariesCount.count || 0) === 0,
        worldBuilding: (worldBuildingCount.count || 0) === 0,
        themes: (themesCount.count || 0) === 0
      };

      // Validate gap detection against actual counts
      const actualCounts = {
        relationships: relationshipsCount.count || 0,
        timelineEvents: timelineEventsCount.count || 0,
        plotThreads: plotThreadsCount.count || 0,
        chapterSummaries: chapterSummariesCount.count || 0,
        worldBuilding: worldBuildingCount.count || 0,
        themes: themesCount.count || 0
      };

      console.log('📊 [GAP DETECTION] Final results:', {
        gaps,
        actualCounts,
        emptyCategories: Object.entries(gaps).filter(([_, isEmpty]) => isEmpty).map(([category]) => category)
      });
      
      return gaps;
    } catch (error) {
      console.error('❌ Error detecting gaps:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Enhanced gap-filling with dependency-aware analysis
   */
  static async fillCategoryGaps(projectId: string, gaps: GapDetectionResult): Promise<GapAnalysisResult> {
    console.log('🎯 Starting enhanced gap-only extraction for project:', projectId);
    
    try {
      // Create comprehensive analysis plan with dependencies
      const dependencyPlan = this.createDependencyAnalysisPlan(gaps);

      if (dependencyPlan.emptyCategories.length === 0) {
        console.log('✅ No gaps detected, skipping extraction');
        return {
          success: true,
          totalExtracted: 0,
          gapsDetected: gaps,
          gapsFilled: [],
          dependencyPlan
        };
      }

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
          gapsFilled: [],
          dependencyPlan
        };
      }

      console.log('🎯 Enhanced extraction plan:', {
        emptyCategories: dependencyPlan.emptyCategories,
        willAnalyze: dependencyPlan.categoriesToAnalyze,
        willStore: dependencyPlan.categoriesToStore
      });

      // Combine all chapter content for comprehensive analysis
      const combinedContent = chapters.map(chapter => 
        `=== ${chapter.title} ===\n${chapter.content}`
      ).join('\n\n');

      console.log(`📖 Combined content length: ${combinedContent.length} characters from ${chapters.length} chapters`);
      
      // Single comprehensive extraction with dependency context
      const extractionResult = await this.extractWithDependencyContext(
        combinedContent,
        projectId,
        dependencyPlan
      );

      console.log(`✅ Enhanced gap extraction complete. Total extracted: ${extractionResult.extractedCount}`);

      return {
        success: true,
        totalExtracted: extractionResult.extractedCount,
        gapsDetected: gaps,
        gapsFilled: extractionResult.categoriesFilled,
        dependencyPlan
      };

    } catch (error) {
      console.error('❌ Enhanced gap extraction failed:', error);
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
   * Enhanced extraction with dependency context - single comprehensive analysis
   */
  private static async extractWithDependencyContext(
    combinedContent: string,
    projectId: string,
    dependencyPlan: DependencyAnalysisPlan
  ): Promise<{ success: boolean; extractedCount: number; categoriesFilled: string[] }> {
    
    try {
      // Convert category names to edge function format
      const targetCategories = dependencyPlan.categoriesToAnalyze.map(category => {
        switch (category) {
          case 'relationships': return 'character_relationships';
          case 'timelineEvents': return 'timeline_events';
          case 'plotThreads': return 'plot_threads';
          case 'chapterSummaries': return 'chapter_summaries';
          case 'worldBuilding': return 'world_building';
          case 'themes': return 'themes';
          case 'characters': return 'characters';
          default: return category;
        }
      });

      const categoriesToStore = dependencyPlan.categoriesToStore.map(category => {
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

      console.log(`🤖 Calling edge function with comprehensive analysis:`, {
        analyzing: targetCategories,
        storing: categoriesToStore
      });

      const { data: result, error } = await supabase.functions.invoke('extract-knowledge', {
        body: {
          projectId,
          chapterId: 'combined-chapters', // Special identifier for combined analysis
          content: combinedContent,
          mode: 'enhanced_gap_fill',
          targetCategories: targetCategories,
          categoriesToStore: categoriesToStore
        }
      });

      if (error) {
        console.error(`❌ Edge function error for comprehensive analysis:`, error);
        return { success: false, extractedCount: 0, categoriesFilled: [] };
      }

      if (!result || !result.success) {
        console.error(`❌ Comprehensive extraction failed:`, result?.error);
        return { success: false, extractedCount: 0, categoriesFilled: [] };
      }

      console.log(`✅ Comprehensive extraction returned:`, result);

      // Store only the results for originally empty categories
      const filteredData = this.filterDataForStorage(result.extractedData, dependencyPlan.categoriesToStore);
      const storageResult = await this.storeExtractedData(filteredData, projectId, 'combined-chapters');
      
      console.log(`💾 Stored ${storageResult.totalStored} items to database from comprehensive analysis`);

      return {
        success: true,
        extractedCount: storageResult.totalStored,
        categoriesFilled: storageResult.categoriesStored
      };

    } catch (error) {
      console.error(`❌ Error in comprehensive extraction:`, error);
      return { success: false, extractedCount: 0, categoriesFilled: [] };
    }
  }

  /**
   * Filter extracted data to only include categories that should be stored
   */
  private static filterDataForStorage(extractedData: any, categoriesToStore: string[]): any {
    const filtered: any = {};

    const categoryMap: Record<string, string> = {
      'character_relationships': 'relationships',
      'timeline_events': 'timelineEvents',
      'plot_threads': 'plotThreads',
      'chapter_summaries': 'chapterSummaries',
      'world_building': 'worldBuilding',
      'themes': 'themes'
    };

    categoriesToStore.forEach(category => {
      const dataKey = categoryMap[category] || category;
      if (extractedData[dataKey]) {
        filtered[dataKey] = extractedData[dataKey];
        console.log(`📋 Including ${dataKey} for storage: ${extractedData[dataKey].length} items`);
      }
    });

    console.log('🔄 Filtered data for storage:', Object.keys(filtered));
    return filtered;
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