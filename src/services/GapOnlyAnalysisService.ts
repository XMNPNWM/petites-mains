import { supabase } from '@/integrations/supabase/client';

interface GapDetectionResult {
  relationships: boolean;
  timelineEvents: boolean;
  plotThreads: boolean;
  chapterSummaries: boolean;
  characters: boolean;
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
        charactersCount,
        worldBuildingCount,
        themesCount
      ] = await Promise.all([
        supabase.from('character_relationships').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('timeline_events').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('plot_threads').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('chapter_summaries').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('category', 'character'),
        supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('category', 'world_building'),
        supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('category', 'theme')
      ]);

      // Log individual query results
      console.log('🔢 [GAP DETECTION] Raw counts:', {
        relationships: { count: relationshipsCount.count, error: relationshipsCount.error },
        timelineEvents: { count: timelineEventsCount.count, error: timelineEventsCount.error },
        plotThreads: { count: plotThreadsCount.count, error: plotThreadsCount.error },
        chapterSummaries: { count: chapterSummariesCount.count, error: chapterSummariesCount.error },
        characters: { count: charactersCount.count, error: charactersCount.error },
        worldBuilding: { count: worldBuildingCount.count, error: worldBuildingCount.error },
        themes: { count: themesCount.count, error: themesCount.error }
      });

      const gaps = {
        relationships: (relationshipsCount.count || 0) === 0,
        timelineEvents: (timelineEventsCount.count || 0) === 0,
        plotThreads: (plotThreadsCount.count || 0) === 0,
        chapterSummaries: (chapterSummariesCount.count || 0) === 0,
        characters: (charactersCount.count || 0) === 0,
        worldBuilding: (worldBuildingCount.count || 0) === 0,
        themes: (themesCount.count || 0) === 0
      };

      // Validate gap detection against actual counts
      const actualCounts = {
        relationships: relationshipsCount.count || 0,
        timelineEvents: timelineEventsCount.count || 0,
        plotThreads: plotThreadsCount.count || 0,
        chapterSummaries: chapterSummariesCount.count || 0,
        characters: charactersCount.count || 0,
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
   * Phase 2: Sequential gap-filling with dependency-aware processing
   */
  static async fillCategoryGaps(projectId: string, gaps: GapDetectionResult): Promise<GapAnalysisResult> {
    console.log('🎯 Starting SEQUENTIAL gap-only extraction for project:', projectId);
    
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

      console.log('🔄 SEQUENTIAL extraction plan:', {
        emptyCategories: dependencyPlan.emptyCategories,
        requiredDependencies: dependencyPlan.requiredDependencies,
        willStore: dependencyPlan.categoriesToStore
      });

      console.log(`📖 Processing ${chapters.length} chapters individually for gap analysis`);
      
      // **NEW: Sequential processing with dependency chaining - Chapter-by-chapter**
      const extractionResult = await this.executeSequentialProcessing(
        chapters,
        projectId,
        dependencyPlan
      );

      console.log(`✅ Sequential gap extraction complete. Total extracted: ${extractionResult.extractedCount}`);

      return {
        success: true,
        totalExtracted: extractionResult.extractedCount,
        gapsDetected: gaps,
        gapsFilled: extractionResult.categoriesFilled,
        dependencyPlan
      };

    } catch (error) {
      console.error('❌ Sequential gap extraction failed:', error);
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
   * NEW: Sequential processing with dependency chaining
   * Process categories in proper dependency order, using fresh data as context
   * NEW: Chapter-by-chapter processing instead of content aggregation
   */
  private static async executeSequentialProcessing(
    chapters: any[],
    projectId: string,
    dependencyPlan: DependencyAnalysisPlan
  ): Promise<{ success: boolean; extractedCount: number; categoriesFilled: string[] }> {
    
    try {
      console.log('🔄 Starting sequential processing with dependency chaining (chapter-by-chapter)...');
      
      let totalExtracted = 0;
      const categoriesFilled: string[] = [];
      const freshContext: Record<string, any[]> = {};

      // Step 1: Process dependencies first (extract fresh data per chapter, don't store)
      for (const dependency of dependencyPlan.requiredDependencies) {
        console.log(`📍 Processing dependency: ${dependency} across ${chapters.length} chapters`);
        
        const dependencyCategory = this.convertToEdgeFunctionFormat(dependency);
        const dependencyData: any[] = [];
        
        // Process each chapter for this dependency
        for (const chapter of chapters) {
          const dependencyResult = await this.extractSingleCategory(
            chapter.content,
            projectId,
            chapter.id,
            dependencyCategory,
            freshContext
          );
          
          if (dependencyResult.success && dependencyResult.extractedData) {
            dependencyData.push(...dependencyResult.extractedData);
          }
        }
        
        if (dependencyData.length > 0) {
          freshContext[dependency] = dependencyData;
          console.log(`✅ Extracted ${dependencyData.length} ${dependency} for context`);
        } else {
          console.log(`⚠️ No ${dependency} extracted for context`);
        }
      }

      // Step 2: Process empty categories with fresh context (extract and store per chapter)
      for (const category of dependencyPlan.emptyCategories) {
        console.log(`🎯 Processing empty category: ${category} with fresh context across ${chapters.length} chapters`);
        
        const edgeFunctionCategory = this.convertToEdgeFunctionFormat(category);
        const categoryData: any[] = [];
        
        // Process each chapter for this category
        for (const chapter of chapters) {
          const categoryResult = await this.extractSingleCategory(
            chapter.content,
            projectId,
            chapter.id,
            edgeFunctionCategory,
            freshContext
          );
          
          if (categoryResult.success && categoryResult.extractedData && categoryResult.extractedData.length > 0) {
            categoryData.push(...categoryResult.extractedData);
          }
        }
        
        if (categoryData.length > 0) {
          // Store the aggregated results for this category
          const storageResult = await this.storeSingleCategory(
            categoryData,
            projectId,
            edgeFunctionCategory
          );
          
          if (storageResult.success) {
            totalExtracted += storageResult.totalStored;
            categoriesFilled.push(category);
            console.log(`✅ Stored ${storageResult.totalStored} ${category} items`);
          }
        } else {
          console.log(`⚠️ No ${category} extracted`);
        }
      }

      console.log(`🎯 Sequential processing complete. Total stored: ${totalExtracted}`);

      return {
        success: true,
        extractedCount: totalExtracted,
        categoriesFilled
      };

    } catch (error) {
      console.error(`❌ Error in sequential processing:`, error);
      return { success: false, extractedCount: 0, categoriesFilled: [] };
    }
  }

  /**
   * Extract a single category with fresh context - Now per-chapter
   */
  private static async extractSingleCategory(
    content: string,
    projectId: string,
    chapterId: string,
    category: string,
    freshContext: Record<string, any[]>
  ): Promise<{ success: boolean; extractedData: any[] | null }> {
    
    try {
      console.log(`🔍 Extracting single category: ${category} for chapter: ${chapterId}`);
      
      const { data: result, error } = await supabase.functions.invoke('extract-knowledge', {
        body: {
          projectId,
          chapterId,
          content,
          mode: 'sequential_gap_fill',
          targetCategory: category,
          freshContext: freshContext
        }
      });

      if (error) {
        console.error(`❌ Edge function error for ${category}:`, error);
        return { success: false, extractedData: null };
      }

      if (!result || !result.success) {
        console.error(`❌ Extraction failed for ${category}:`, result?.error);
        return { success: false, extractedData: null };
      }

      const extractedData = result.extractedData?.[this.convertFromEdgeFunctionFormat(category)] || [];
      console.log(`✅ Single category extraction for ${category}:`, extractedData.length, 'items');

      return {
        success: true,
        extractedData
      };

    } catch (error) {
      console.error(`❌ Error extracting ${category}:`, error);
      return { success: false, extractedData: null };
    }
  }

  /**
   * Store data for a single category
   */
  private static async storeSingleCategory(
    data: any[],
    projectId: string,
    category: string
  ): Promise<{ success: boolean; totalStored: number }> {
    
    try {
      console.log(`💾 [STORAGE DEBUG] Storing ${data.length} items for category: ${category}`);
      console.log(`💾 [STORAGE DEBUG] Data preview:`, data.slice(0, 2));
      
      const categoryKey = this.convertFromEdgeFunctionFormat(category);
      const dataToStore = { [categoryKey]: data };
      
      console.log(`💾 [STORAGE DEBUG] Formatted data with key '${categoryKey}':`, {
        [categoryKey]: data.length + ' items'
      });
      
      const storageResult = await this.storeExtractedData(dataToStore, projectId, null);
      
      console.log(`💾 [STORAGE DEBUG] Storage result for ${category}:`, storageResult);
      
      return {
        success: true,
        totalStored: storageResult.totalStored
      };
      
    } catch (error) {
      console.error(`❌ Error storing ${category}:`, error);
      return { success: false, totalStored: 0 };
    }
  }

  /**
   * Convert category names to edge function format
   */
  private static convertToEdgeFunctionFormat(category: string): string {
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
  }

  /**
   * Convert edge function format back to internal format
   */
  private static convertFromEdgeFunctionFormat(category: string): string {
    switch (category) {
      case 'character_relationships': return 'relationships';
      case 'timeline_events': return 'timelineEvents';
      case 'plot_threads': return 'plotThreads';
      case 'chapter_summaries': return 'chapterSummaries';
      case 'world_building': return 'worldBuilding';
      case 'themes': return 'themes';
      case 'characters': return 'characters';
      default: return category;
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
    chapterId: string | null
  ): Promise<{ totalStored: number; categoriesStored: string[] }> {
    
    // 🔍 ENHANCED VALIDATION: Comprehensive input validation
    if (!projectId || projectId === 'NULL' || projectId === 'null' || projectId === 'undefined') {
      console.error('❌ [STORAGE ERROR] Invalid projectId detected:', projectId);
      console.error('❌ [STORAGE ERROR] Type:', typeof projectId);
      console.error('❌ [STORAGE ERROR] Stack trace:', new Error().stack);
      throw new Error(`Invalid projectId: ${projectId}. Cannot store data with invalid project reference.`);
    }

    // UUID format validation for projectId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(projectId)) {
      console.error('❌ [STORAGE ERROR] ProjectId is not a valid UUID format:', projectId);
      throw new Error(`Invalid UUID format for projectId: ${projectId}`);
    }

    console.log('✅ [STORAGE DEBUG] Input validation passed:', { projectId, chapterId });
    
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
               source_chapter_ids: chapterId ? [chapterId] : [],
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
           source_chapter_ids: chapterId ? [chapterId] : [],
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
          source_chapter_ids: chapterId ? [chapterId] : [],
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

      // **ENHANCED: Store characters in knowledge_base table with comprehensive validation**
      if (extractedData.characters && extractedData.characters.length > 0) {
        console.log(`💾 [CHARACTERS] Storing ${extractedData.characters.length} characters...`);
        console.log(`💾 [CHARACTERS] Raw data preview:`, extractedData.characters.slice(0, 2));
        
        // Validate and prepare characters data
        const validCharacters = extractedData.characters.filter((character: any) => {
          const isValid = character?.name && 
                          typeof character.name === 'string' && 
                          character.name.trim().length > 0;
          
          if (!isValid) {
            console.log('⚠️ [CHARACTERS] Skipping invalid character:', character);
          }
          return isValid;
        });

        if (validCharacters.length > 0) {
          const charactersToStore = validCharacters.map((character: any) => {
            // Ensure all required fields are properly set
            const record = {
              project_id: projectId,
              name: String(character.name).trim(),
              category: 'character' as const,
              subcategory: character.role || character.subcategory || 'character',
              description: character.description || character.traits?.join(', ') || '',
              evidence: character.evidence || character.source_text || '',
              confidence_score: Math.min(Math.max(Number(character.confidence_score) || 0.5, 0), 1),
               source_chapter_ids: chapterId ? [chapterId] : [],
              is_newly_extracted: true,
              extraction_method: 'llm_direct' as const
            };
            
            console.log(`💾 [CHARACTERS] Prepared record:`, record);
            return record;
          });

          console.log(`💾 [CHARACTERS] Attempting to store ${charactersToStore.length} validated characters...`);

          const { data: charactersData, error: charactersError } = await supabase
            .from('knowledge_base')
            .insert(charactersToStore)
            .select();

          if (!charactersError && charactersData) {
            totalStored += charactersData.length;
            categoriesStored.push('characters');
            console.log(`✅ [CHARACTERS] Successfully stored ${charactersData.length} characters`);
            
            charactersData.forEach((char: any, index: number) => {
              console.log(`   ${index + 1}. ${char.name} (${char.subcategory}) [ID: ${char.id}]`);
            });
          } else {
            console.error('❌ [CHARACTERS] Failed to store characters:', charactersError);
            console.error('❌ [CHARACTERS] Error details:', {
              message: charactersError?.message,
              details: charactersError?.details,
              hint: charactersError?.hint,
              code: charactersError?.code
            });
            console.error('❌ [CHARACTERS] Attempted data:', charactersToStore);
          }
        } else {
          console.log('⚠️ [CHARACTERS] No valid characters to store after validation');
        }
      } else {
        console.log('ℹ️ [CHARACTERS] No characters found in extracted data');
      }

      // **ENHANCED: Store world building in knowledge_base table with comprehensive validation**
      if (extractedData.worldBuilding && extractedData.worldBuilding.length > 0) {
        console.log(`💾 [WORLD_BUILDING] Storing ${extractedData.worldBuilding.length} world building elements...`);
        console.log(`💾 [WORLD_BUILDING] Raw data preview:`, extractedData.worldBuilding.slice(0, 2));
        
        // Validate and prepare world building data
        const validWorldBuilding = extractedData.worldBuilding.filter((element: any) => {
          const isValid = element?.name && 
                          typeof element.name === 'string' && 
                          element.name.trim().length > 0;
          
          if (!isValid) {
            console.log('⚠️ [WORLD_BUILDING] Skipping invalid element:', element);
          }
          return isValid;
        });

        if (validWorldBuilding.length > 0) {
          const worldBuildingToStore = validWorldBuilding.map((element: any) => {
            // Ensure all required fields are properly set
            const record = {
              project_id: projectId,
              name: String(element.name).trim(),
              category: 'world_building' as const,
              subcategory: element.category || element.subcategory || element.type || 'Location',
              description: element.description || '',
              evidence: element.evidence || element.source_text || '',
              confidence_score: Math.min(Math.max(Number(element.confidence_score) || 0.5, 0), 1),
               source_chapter_ids: chapterId ? [chapterId] : [],
              is_newly_extracted: true,
              extraction_method: 'llm_direct' as const
            };
            
            console.log(`💾 [WORLD_BUILDING] Prepared record:`, record);
            return record;
          });

          console.log(`💾 [WORLD_BUILDING] Attempting to store ${worldBuildingToStore.length} validated elements...`);

          const { data: worldBuildingData, error: worldBuildingError } = await supabase
            .from('knowledge_base')
            .insert(worldBuildingToStore)
            .select();

          if (!worldBuildingError && worldBuildingData) {
            totalStored += worldBuildingData.length;
            categoriesStored.push('worldBuilding');
            console.log(`✅ [WORLD_BUILDING] Successfully stored ${worldBuildingData.length} world building elements`);
            
            worldBuildingData.forEach((element: any, index: number) => {
              console.log(`   ${index + 1}. ${element.name} (${element.subcategory}) [ID: ${element.id}]`);
            });
          } else {
            console.error('❌ [WORLD_BUILDING] Failed to store world building:', worldBuildingError);
            console.error('❌ [WORLD_BUILDING] Error details:', {
              message: worldBuildingError?.message,
              details: worldBuildingError?.details,
              hint: worldBuildingError?.hint,
              code: worldBuildingError?.code
            });
            console.error('❌ [WORLD_BUILDING] Attempted data:', worldBuildingToStore);
          }
        } else {
          console.log('⚠️ [WORLD_BUILDING] No valid world building elements to store after validation');
        }
      } else {
        console.log('ℹ️ [WORLD_BUILDING] No world building found in extracted data');
      }

      // **ENHANCED: Store themes in knowledge_base table with comprehensive validation**
      if (extractedData.themes && extractedData.themes.length > 0) {
        console.log(`💾 [THEMES] Storing ${extractedData.themes.length} themes...`);
        console.log(`💾 [THEMES] Raw data preview:`, extractedData.themes.slice(0, 2));
        
        // Validate and prepare themes data
        const validThemes = extractedData.themes.filter((theme: any) => {
          const isValid = theme?.name && 
                          typeof theme.name === 'string' && 
                          theme.name.trim().length > 0;
          
          if (!isValid) {
            console.log('⚠️ [THEMES] Skipping invalid theme:', theme);
          }
          return isValid;
        });

        if (validThemes.length > 0) {
          const themesToStore = validThemes.map((theme: any) => {
            // Ensure all required fields are properly set
            const record = {
              project_id: projectId,
              name: String(theme.name).trim(),
              category: 'theme' as const,
              subcategory: theme.subcategory || 'narrative_theme',
              description: theme.description || '',
              evidence: theme.significance || theme.evidence || theme.source_text || '',
              confidence_score: Math.min(Math.max(Number(theme.confidence_score) || 0.5, 0), 1),
               source_chapter_ids: chapterId ? [chapterId] : [],
              is_newly_extracted: true,
              extraction_method: 'llm_direct' as const
            };
            
            console.log(`💾 [THEMES] Prepared record:`, record);
            return record;
          });

          console.log(`💾 [THEMES] Attempting to store ${themesToStore.length} validated themes...`);

          const { data: themesData, error: themesError } = await supabase
            .from('knowledge_base')
            .insert(themesToStore)
            .select();

          if (!themesError && themesData) {
            totalStored += themesData.length;
            categoriesStored.push('themes');
            console.log(`✅ [THEMES] Successfully stored ${themesData.length} themes`);
            
            themesData.forEach((theme: any, index: number) => {
              console.log(`   ${index + 1}. ${theme.name} [ID: ${theme.id}]`);
            });
          } else {
            console.error('❌ [THEMES] Failed to store themes:', themesError);
            console.error('❌ [THEMES] Error details:', {
              message: themesError?.message,
              details: themesError?.details,
              hint: themesError?.hint,
              code: themesError?.code
            });
            console.error('❌ [THEMES] Attempted data:', themesToStore);
          }
        } else {
          console.log('⚠️ [THEMES] No valid themes to store after validation');
        }
      } else {
        console.log('ℹ️ [THEMES] No themes found in extracted data');
      }

      console.log(`💾 Storage complete: ${totalStored} items stored across ${categoriesStored.length} categories`);
      console.log(`📊 Categories stored: ${categoriesStored.join(', ')}`);
      
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