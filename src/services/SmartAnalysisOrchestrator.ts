import { supabase } from '@/integrations/supabase/client';
import { RefinementService } from './RefinementService';
import { ContentHashService } from './ContentHashService';
import { ChronologicalCoordinationService } from './ChronologicalCoordinationService';
import { SemanticDeduplicationService } from './SemanticDeduplicationService';
import { EmbeddingsBasedProcessingService } from './EmbeddingsBasedProcessingService';
import { EnhancedEmbeddingsService } from './EnhancedEmbeddingsService';
import { EmbeddingBasedSemanticMerger } from './EmbeddingBasedSemanticMerger';
import { KnowledgeBase, ChapterSummary, PlotPoint } from '@/types/knowledge';

export class SmartAnalysisOrchestrator {
  static async analyzeChapter(projectId: string, chapterId: string, onComplete?: () => void): Promise<void> {
    try {
      console.log('Starting chapter analysis:', { projectId, chapterId });

      // Get chapter content
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (chapterError) {
        console.error('Error fetching chapter:', chapterError);
        throw new Error(`Failed to fetch chapter: ${chapterError.message}`);
      }

      if (!chapter?.content) {
        throw new Error('Chapter content is empty');
      }

      console.log('Chapter loaded, content length:', chapter.content.length);

      // Get or create refinement data for content enhancement
      let refinementData = await RefinementService.fetchRefinementData(chapterId);
      if (!refinementData) {
        refinementData = await RefinementService.createRefinementData(chapterId, chapter.content);
        if (!refinementData) {
          throw new Error('Failed to create refinement data');
        }
      }

      console.log('Refinement data ready:', refinementData.id);

      // Enhance content using the enhance-chapter edge function
      try {
        console.log('🎯 Calling enhance-chapter edge function with content length:', chapter.content.length);
        
        const { data: enhancementResult, error: enhancementError } = await supabase.functions.invoke('enhance-chapter', {
          body: { 
            content: chapter.content,
            projectId: projectId,
            chapterId: chapterId,
            options: {
              enhancementLevel: 'moderate',
              preserveAuthorVoice: true,
              applyGrammarFixes: true,
              applyPunctuationFixes: true,
              applyFormattingFixes: true,
              improveReadability: true,
              improveStyle: true,
              improveShowVsTell: false,
              refinePacing: false,
              enhanceCharacterVoice: true,
              addSensoryDetails: false
            }
          }
        });

        console.log('📥 Enhancement edge function response:', {
          hasData: !!enhancementResult,
          hasError: !!enhancementError,
          dataKeys: enhancementResult ? Object.keys(enhancementResult) : [],
          errorDetails: enhancementError
        });

        if (enhancementError) {
          console.error('Content enhancement failed:', enhancementError);
          throw new Error(`Content enhancement failed: ${enhancementError.message}`);
        }

        if (enhancementResult?.enhancedContent) {
          await RefinementService.updateRefinementContent(refinementData.id, enhancementResult.enhancedContent);
          console.log('✅ Content enhanced successfully, length:', enhancementResult.enhancedContent.length);
        } else {
          console.warn('Enhancement service returned no enhanced content, using original content');
          await RefinementService.updateRefinementContent(refinementData.id, chapter.content);
        }
        
        // Call the completion callback to refresh UI
        if (onComplete) {
          onComplete();
        }
      } catch (aiError) {
        console.error('AI enhancement failed:', aiError);
        // Graceful fallback - use original content
        const fallbackContent = chapter.content + '\n\n[AI enhancement unavailable - content preserved as-is]';
        await RefinementService.updateRefinementContent(refinementData.id, fallbackContent);
        console.log('Using fallback content due to enhancement failure');
        
        // Call the completion callback even on fallback
        if (onComplete) {
          onComplete();
        }
      }

      console.log('Chapter analysis completed successfully');

    } catch (error) {
      console.error('Analysis orchestrator error:', error);
      throw error;
    }
  }

  static async forceReAnalyzeProject(projectId: string, contentTypes: string[]): Promise<any> {
    console.log('🔥 [FORCE] Force re-analysis using standard analysis flow:', projectId, 'types:', contentTypes);
    
    // Simply call analyzeProject with force options
    return this.analyzeProject(projectId, {
      forceReExtraction: true,
      contentTypesToExtract: contentTypes
    });
  }

  static async analyzeProject(projectId: string, options: { forceReExtraction?: boolean; contentTypesToExtract?: string[] } = {}): Promise<any> {
    try {
      const { forceReExtraction = false, contentTypesToExtract = [] } = options;
      console.log('🚀 [SMART] Starting comprehensive project analysis:', projectId, { forceReExtraction, contentTypesToExtract });

      // PHASE 0: Cleanup existing duplicates
      console.log('🧹 Phase 0: Cleaning up existing duplicates');
      await this.cleanupExistingDuplicates(projectId);

      // PHASE 1: Hash Verification - Check what actually needs analysis
      console.log('📋 Phase 1: Checking content hashes for all chapters');
      
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      if (chaptersError) {
        throw new Error(`Failed to fetch chapters: ${chaptersError.message}`);
      }

      if (!chapters || chapters.length === 0) {
        console.log('No chapters found for analysis');
        return {
          success: true,
          processingStats: {
            contentAnalyzed: 0,
            creditsUsed: 0,
            knowledgeExtracted: 0,
            chaptersSkipped: 0,
            hashVerificationSaved: true
          }
        };
      }

      // Check which chapters need analysis based on content hashes
      let chaptersNeedingAnalysis = [];
      let chaptersSkipped = 0;
      
      for (const chapter of chapters) {
        if (chapter.content && chapter.content.trim().length > 0) {
          try {
            const hashResult = await ContentHashService.verifyContentHash(chapter.id, chapter.content);
            console.log(`🔍 Hash check for chapter "${chapter.title}":`, hashResult);
            
            if (hashResult.hasChanges) {
              console.log(`🚨 Chapter "${chapter.title}" needs analysis - content changed`);
              chaptersNeedingAnalysis.push(chapter);
            } else {
              console.log(`✅ Chapter "${chapter.title}" skipped - no changes detected`);
              chaptersSkipped++;
            }
          } catch (hashError) {
            console.error(`⚠️ Hash verification failed for chapter ${chapter.id}:`, hashError);
            // If hash verification fails, include in analysis to be safe
            chaptersNeedingAnalysis.push(chapter);
          }
        }
      }

      // Check if this is the first analysis (no existing knowledge)
      const existingKnowledge = await this.getProjectKnowledge(projectId);
      const isFirstAnalysis = existingKnowledge.length === 0;

      if (isFirstAnalysis) {
        console.log('🆕 First analysis detected - analyzing all chapters regardless of hash status');
        chaptersNeedingAnalysis = chapters.filter(c => c.content && c.content.trim().length > 0);
        chaptersSkipped = 0;
      }

      console.log(`📊 Analysis plan: ${chaptersNeedingAnalysis.length} chapters to analyze, ${chaptersSkipped} chapters skipped`);

      if (chaptersNeedingAnalysis.length === 0) {
        console.log('✅ All chapters are up-to-date, no analysis needed');
        
        // Still run knowledge base optimization for existing projects
        if (!isFirstAnalysis) {
          console.log('🛠️ Running knowledge base optimization...');
          try {
            const optimizationResult = await EmbeddingsBasedProcessingService.optimizeKnowledgeBase(projectId);
            console.log('✅ Knowledge base optimization completed:', optimizationResult);
          } catch (optimizationError) {
            console.warn('⚠️ Knowledge base optimization failed:', optimizationError);
          }
        }
        
        return {
          success: true,
          processingStats: {
            contentAnalyzed: 0,
            creditsUsed: 0,
            knowledgeExtracted: existingKnowledge.length,
            chaptersSkipped: chaptersSkipped,
            hashVerificationSaved: true,
            message: 'All content is up-to-date'
          }
        };
      }

      // PHASE 1.5: Embeddings-based content similarity check (skip if force re-extraction)
      let embeddingsSkipped = 0;
      let embeddingsFiltered = [];
      
      if (forceReExtraction) {
        console.log('🔥 Phase 1.5: Skipping embeddings similarity check due to force re-extraction');
        embeddingsFiltered = chaptersNeedingAnalysis;
      } else {
        console.log('🔍 Phase 1.5: Checking content similarity using embeddings...');
        
        for (const chapter of chaptersNeedingAnalysis) {
          try {
            const processingCheck = await EmbeddingsBasedProcessingService.checkContentProcessingNeed(
              projectId,
              chapter.content || '',
              chapter.id
            );
            
            if (processingCheck.shouldSkipExtraction) {
              console.log(`⏭️ Skipping chapter "${chapter.title}" - too similar to existing content`);
              embeddingsSkipped++;
            } else {
              embeddingsFiltered.push(chapter);
              if (processingCheck.similarContent) {
                console.log(`🔄 Chapter "${chapter.title}" has similar content - will apply enhanced deduplication`);
              }
            }
          } catch (embeddingsError) {
            console.warn(`⚠️ Embeddings check failed for chapter ${chapter.id}, including in analysis:`, embeddingsError);
            embeddingsFiltered.push(chapter);
          }
        }
      }
      
      // Update chapters list after embeddings filtering
      chaptersNeedingAnalysis = embeddingsFiltered;
      console.log(`🧠 Embeddings analysis: ${embeddingsSkipped} chapters skipped due to similarity, ${chaptersNeedingAnalysis.length} chapters to process`);
      
      if (chaptersNeedingAnalysis.length === 0) {
        console.log('✅ All chapters filtered out by embeddings similarity check');
        return {
          success: true,
          processingStats: {
            contentAnalyzed: 0,
            creditsUsed: 0,
            knowledgeExtracted: existingKnowledge.length,
            chaptersSkipped: chaptersSkipped + embeddingsSkipped,
            hashVerificationSaved: true,
            embeddingsOptimization: true,
            message: 'All content filtered by similarity analysis'
          }
        };
      }

      // PHASE 2: Enhanced Knowledge Extraction using comprehensive extract-knowledge function
      let totalContentAnalyzed = 0;
      let totalCreditsUsed = 0;
      let totalKnowledgeExtracted = 0;

      // Combine content from chapters that need analysis
      const contentToAnalyze = chaptersNeedingAnalysis.map(chapter => 
        `Chapter: ${chapter.title}\n${chapter.content || ''}`
      ).join('\n\n---CHAPTER_BREAK---\n\n');

      console.log(`🧠 Phase 2: Comprehensive knowledge extraction from ${chaptersNeedingAnalysis.length} chapters (${contentToAnalyze.length} chars)`);

      // Use the enhanced extract-knowledge edge function with comprehensive extraction
      const primaryChapterId = chaptersNeedingAnalysis[0]?.id;
      
      console.log('🔧 DEBUG: About to call extract-knowledge edge function with:', {
        contentLength: contentToAnalyze.length,
        projectId: projectId,
        primaryChapterId: primaryChapterId,
        extractionType: 'comprehensive',
        chaptersToAnalyze: chaptersNeedingAnalysis.length
      });
      
      // First test with small content to isolate the issue
      const testContent = contentToAnalyze.length > 1000 ? contentToAnalyze.substring(0, 1000) + "..." : contentToAnalyze;
      
      console.log('🔧 DEBUG: Testing with reduced content length:', testContent.length);
      
      console.log('🚀 Calling extract-knowledge edge function with parameters:', {
        contentLength: contentToAnalyze.length,
        projectId: projectId,
        chapterId: primaryChapterId,
        options: {
          forceReExtraction,
          contentTypesToExtract,
          useEmbeddingsBasedProcessing: true
        }
      });

      const { data: knowledgeResult, error: knowledgeError } = await supabase.functions.invoke('extract-knowledge', {
        body: { 
          content: contentToAnalyze,
          projectId: projectId,
          chapterId: primaryChapterId,
          options: {
            forceReExtraction,
            contentTypesToExtract,
            useEmbeddingsBasedProcessing: true
          }
        }
      });

      console.log('📥 extract-knowledge edge function response:', {
        hasData: !!knowledgeResult,
        hasError: !!knowledgeError,
        errorDetails: knowledgeError,
        dataKeys: knowledgeResult ? Object.keys(knowledgeResult) : [],
        success: knowledgeResult?.success,
        extractedDataKeys: knowledgeResult?.extractedData ? Object.keys(knowledgeResult.extractedData) : []
      });

      if (knowledgeResult?.extractedData) {
        console.log('📊 Detailed extraction results from edge function:', {
          characters: knowledgeResult.extractedData.characters?.length || 0,
          relationships: knowledgeResult.extractedData.relationships?.length || 0,
          timelineEvents: knowledgeResult.extractedData.timelineEvents?.length || 0,
          plotThreads: knowledgeResult.extractedData.plotThreads?.length || 0,
          plotPoints: knowledgeResult.extractedData.plotPoints?.length || 0,
          chapterSummaries: knowledgeResult.extractedData.chapterSummaries?.length || 0,
          worldBuilding: knowledgeResult.extractedData.worldBuilding?.length || 0,
          themes: knowledgeResult.extractedData.themes?.length || 0
        });
      }

      if (knowledgeError) {
        console.error('❌ Comprehensive knowledge extraction failed:', knowledgeError);
        throw new Error(`Knowledge extraction failed: ${knowledgeError.message}`);
      }

      if (knowledgeResult?.success && knowledgeResult.extractedData) {
        console.log('✅ Comprehensive knowledge extraction completed');
        console.log('📊 Extraction results:', {
          characters: knowledgeResult.extractedData.characters?.length || 0,
          relationships: knowledgeResult.extractedData.relationships?.length || 0,
          plotThreads: knowledgeResult.extractedData.plotThreads?.length || 0,
          timelineEvents: knowledgeResult.extractedData.timelineEvents?.length || 0,
          plotPoints: knowledgeResult.extractedData.plotPoints?.length || 0,
          chapterSummaries: knowledgeResult.extractedData.chapterSummaries?.length || 0,
          language: knowledgeResult.storageDetails?.language || 'unknown',
          extractionStats: knowledgeResult.storageDetails?.extractionStats || {}
        });

        // Store the extracted knowledge in the database with force flag
        const storedItems = await this.storeComprehensiveKnowledge(projectId, knowledgeResult.extractedData, chaptersNeedingAnalysis, forceReExtraction);
        totalKnowledgeExtracted = storedItems;
        
        console.log(`📚 Stored ${totalKnowledgeExtracted} knowledge items in database`);

        // PHASE 2.5: Apply chronological coordination to all stored elements
        console.log('🕒 Phase 2.5: Applying chronological coordination');
        try {
          const coordinationResult = await ChronologicalCoordinationService.assignChronologicalOrder(projectId);
          console.log('✅ Chronological coordination completed:', {
            elementsProcessed: coordinationResult.elementsProcessed,
            sequencesCreated: coordinationResult.sequencesCreated
          });
        } catch (coordinationError) {
          console.warn('⚠️ Chronological coordination failed but continuing analysis:', coordinationError);
        }
        
        if (knowledgeResult.validation?.issues && knowledgeResult.validation.issues.length > 0) {
          console.warn('⚠️ Some issues occurred during extraction:', knowledgeResult.validation.issues);
        }
      } else {
        console.warn('⚠️ Knowledge extraction returned no data or failed silently');
      }

      // PHASE 3: Update content hashes for analyzed chapters
      console.log('🔄 Phase 3: Updating content hashes for analyzed chapters');
      
      for (const chapter of chaptersNeedingAnalysis) {
        try {
          await ContentHashService.updateContentHash(chapter.id, chapter.content || '');
          console.log(`✅ Updated hash for chapter "${chapter.title}"`);
        } catch (hashError) {
          console.error(`⚠️ Failed to update hash for chapter ${chapter.id}:`, hashError);
        }
      }

      // PHASE 4: Analyze individual chapters for refinement
      console.log('📝 Phase 4: Processing chapters for refinement');
      
      for (const chapter of chaptersNeedingAnalysis) {
        try {
          await this.analyzeChapter(projectId, chapter.id);
          totalContentAnalyzed++;
          totalCreditsUsed += 1; // Simplified credit counting
        } catch (error) {
          console.error(`Failed to analyze chapter ${chapter.id}:`, error);
          // Continue with other chapters
        }
      }

      // PHASE 5: Final embeddings-based optimization
      console.log('🛠️ Phase 5: Final knowledge base optimization with embeddings');
      try {
        const optimizationResult = await EmbeddingsBasedProcessingService.optimizeKnowledgeBase(projectId);
        console.log('✅ Final optimization completed:', optimizationResult);
      } catch (optimizationError) {
        console.warn('⚠️ Final optimization failed but analysis completed:', optimizationError);
      }

      console.log('✅ [SMART] Comprehensive project analysis completed successfully');

      return {
        success: true,
        processingStats: {
          contentAnalyzed: totalContentAnalyzed,
          creditsUsed: totalCreditsUsed,
          knowledgeExtracted: totalKnowledgeExtracted,
          chaptersSkipped: chaptersSkipped,
          hashVerificationSaved: chaptersSkipped > 0,
          extractionDetails: knowledgeResult?.storageDetails || {},
          message: chaptersSkipped > 0 
            ? `Analyzed ${chaptersNeedingAnalysis.length} changed chapters, skipped ${chaptersSkipped} unchanged chapters`
            : `Analyzed ${chaptersNeedingAnalysis.length} chapters with comprehensive extraction`
        }
      };

    } catch (error) {
      console.error('❌ [SMART] Comprehensive project analysis failed:', error);
      throw error;
    }
  }

  // Enhanced method to store all extracted knowledge types in database with intelligent deduplication
  static async storeComprehensiveKnowledge(projectId: string, extractedData: any, sourceChapters: any[], forceReExtraction: boolean = false): Promise<number> {
    let storedCount = 0;
    const sourceChapterIds = sourceChapters.map(c => c.id);

    try {
      // Store characters with intelligent deduplication
      if (extractedData.characters && extractedData.characters.length > 0) {
        for (const character of extractedData.characters) {
          try {
            await this.storeOrUpdateCharacter(projectId, character, sourceChapterIds, forceReExtraction);
            storedCount++;
          } catch (charError) {
            console.error('Error processing character:', character, charError);
          }
        }
      }

      // Store world building elements (new category)
      if (extractedData.worldBuilding && extractedData.worldBuilding.length > 0) {
        for (const worldElement of extractedData.worldBuilding) {
          try {
            await this.storeOrUpdateWorldBuilding(projectId, worldElement, sourceChapterIds, forceReExtraction);
            storedCount++;
          } catch (worldError) {
            console.error('Error processing world building:', worldElement, worldError);
          }
        }
      }

      // Store themes (new category)
      if (extractedData.themes && extractedData.themes.length > 0) {
        for (const theme of extractedData.themes) {
          try {
            await this.storeOrUpdateTheme(projectId, theme, sourceChapterIds, forceReExtraction);
            storedCount++;
          } catch (themeError) {
            console.error('Error processing theme:', theme, themeError);
          }
        }
      }

      // Store relationships with intelligent deduplication
      if (extractedData.relationships && extractedData.relationships.length > 0) {
        console.log(`🤝 Processing ${extractedData.relationships.length} relationships (forceReExtraction: ${forceReExtraction})`);
        for (const relationship of extractedData.relationships) {
          try {
            console.log(`🎯 About to store relationship: ${relationship.character_a_name} - ${relationship.character_b_name}`);
            await this.storeOrUpdateRelationship(projectId, relationship, sourceChapterIds, forceReExtraction);
            storedCount++;
            console.log(`✅ Successfully stored relationship ${storedCount}`);
          } catch (relError) {
            console.error('❌ Error processing relationship:', relationship, relError);
          }
        }
      } else {
        console.log(`⚠️ No relationships to process (extracted: ${extractedData.relationships?.length || 0})`);
      }

      // Store plot threads with intelligent deduplication
      if (extractedData.plotThreads && extractedData.plotThreads.length > 0) {
        for (const plotThread of extractedData.plotThreads) {
          try {
            await this.storeOrUpdatePlotThread(projectId, plotThread, sourceChapterIds, forceReExtraction);
            storedCount++;
          } catch (plotError) {
            console.error('Error processing plot thread:', plotThread, plotError);
          }
        }
      }

      // Store timeline events with intelligent deduplication
      if (extractedData.timelineEvents && extractedData.timelineEvents.length > 0) {
        console.log(`📅 Processing ${extractedData.timelineEvents.length} timeline events (forceReExtraction: ${forceReExtraction})`);
        for (const event of extractedData.timelineEvents) {
          try {
            console.log(`🎯 About to store timeline event: ${event.event_name || event.event_summary}`);
            await this.storeOrUpdateTimelineEvent(projectId, event, sourceChapterIds, forceReExtraction);
            storedCount++;
            console.log(`✅ Successfully stored timeline event ${storedCount}`);
          } catch (eventError) {
            console.error('❌ Error processing timeline event:', event, eventError);
          }
        }
      } else {
        console.log(`⚠️ No timeline events to process (extracted: ${extractedData.timelineEvents?.length || 0})`);
      }

      // Store plot points with intelligent deduplication
      if (extractedData.plotPoints && extractedData.plotPoints.length > 0) {
        for (const plotPoint of extractedData.plotPoints) {
          try {
            await this.storeOrUpdatePlotPoint(projectId, plotPoint, sourceChapterIds, forceReExtraction);
            storedCount++;
          } catch (plotPointError) {
            console.error('Error processing plot point:', plotPoint, plotPointError);
          }
        }
      }

      // Store chapter summaries with intelligent deduplication
      if (extractedData.chapterSummaries && extractedData.chapterSummaries.length > 0) {
        for (const summary of extractedData.chapterSummaries) {
          try {
            await this.storeOrUpdateChapterSummary(projectId, summary, sourceChapters, forceReExtraction);
            storedCount++;
          } catch (summaryError) {
            console.error('Error processing chapter summary:', summary, summaryError);
          }
        }
      }

      console.log(`✅ Successfully stored ${storedCount} comprehensive knowledge items`);
      return storedCount;

    } catch (error) {
      console.error('❌ Error storing comprehensive knowledge:', error);
      return storedCount;
    }
  }

  // Intelligent character deduplication and merging
  static async storeOrUpdateCharacter(projectId: string, character: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    const relevanceScore = await this.calculateRelevanceScore('character', character.description || '', character);
    
    // Check for existing character by name
    const { data: existingCharacters, error: searchError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('project_id', projectId)
      .eq('category', 'character')
      .ilike('name', character.name.trim());

    if (searchError) {
      console.error('Error searching for existing character:', searchError);
      return;
    }

    if (existingCharacters && existingCharacters.length > 0) {
      // Character exists - intelligently merge information
      const existingChar = existingCharacters[0];
      
      // Don't overwrite user-edited content (unless forced)
      if (existingChar.user_edited && !forceReExtraction) {
        console.log(`⏭️ Skipping user-edited character: ${character.name}`);
        return;
      }

      // Merge descriptions intelligently based on relevance
      const mergedDescription = this.mergeDescriptions(
        existingChar.description || '',
        character.description || '',
        existingChar.relevance_score || 0.5,
        relevanceScore
      );

      // Merge traits
      const existingTraits = (existingChar.details as any)?.traits || [];
      const newTraits = character.traits || [];
      const mergedTraits = [...new Set([...existingTraits, ...newTraits])];

      // Update with highest confidence and merged content
      const updateData = {
        description: mergedDescription,
        details: {
          ...((existingChar.details as any) || {}),
          traits: mergedTraits,
          role: character.role || (existingChar.details as any)?.role
        },
        confidence_score: Math.max(existingChar.confidence_score, character.ai_confidence || 0.5),
        relevance_score: Math.max(existingChar.relevance_score || 0.5, relevanceScore),
        source_chapter_ids: [...new Set([
          ...(existingChar.source_chapter_ids as string[] || []),
          ...sourceChapterIds
        ])],
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('knowledge_base')
        .update(updateData)
        .eq('id', existingChar.id);

      if (updateError) {
        console.error('Error updating character:', updateError);
      } else {
        console.log(`🔄 Updated character: ${character.name} with merged content`);
      }
    } else {
      // New character - create with relevance scoring
      const { error } = await supabase
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
          confidence_score: character.ai_confidence || 0.5,
          relevance_score: relevanceScore,
          extraction_method: 'llm_direct',
          source_chapter_ids: sourceChapterIds,
          is_newly_extracted: true,
          ai_confidence_new: character.ai_confidence || 0.5
        });

      if (error) {
        console.error('Error storing new character:', character.name, error);
      } else {
        console.log(`✅ Created new character: ${character.name}`);
      }
    }
  }

  // Store or update world building elements
  static async storeOrUpdateWorldBuilding(projectId: string, worldElement: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    const { error } = await supabase
      .from('knowledge_base')
      .insert({
        project_id: projectId,
        name: worldElement.name || 'Unnamed World Element',
        category: 'world_building',
        subcategory: worldElement.type || 'general',
        description: worldElement.description,
        details: worldElement.details || {},
        confidence_score: worldElement.ai_confidence || 0.8,
        relevance_score: 0.8, // World building is inherently relevant
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: worldElement.ai_confidence || 0.8
      });

    if (error) {
      console.error('Error storing world building element:', worldElement, error);
    }
  }

  // Store or update themes
  static async storeOrUpdateTheme(projectId: string, theme: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    const { error } = await supabase
      .from('knowledge_base')
      .insert({
        project_id: projectId,
        name: theme.name || 'Unnamed Theme',
        category: 'theme',
        subcategory: theme.type || 'general',
        description: theme.exploration_summary || theme.description,
        details: {
          key_moments: theme.key_moments_or_characters || [],
          exploration: theme.exploration_summary
        },
        confidence_score: theme.ai_confidence || 0.7,
        relevance_score: 0.7, // Themes are important for narrative analysis
        extraction_method: 'llm_direct',
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: theme.ai_confidence || 0.7
      });

    if (error) {
      console.error('Error storing theme:', theme, error);
    }
  }

  // Calculate relevance score based on content
  static async calculateRelevanceScore(category: string, description: string, entity: any): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_relevance_score', {
          category_param: category as 'character' | 'plot_point' | 'world_building' | 'theme' | 'relationship' | 'other',
          description_param: description,
          details_param: entity
        });

      if (error) {
        console.error('Error calculating relevance score:', error);
        return 0.5; // Default fallback
      }

      return data || 0.5;
    } catch (error) {
      console.error('Error calling relevance function:', error);
      return 0.5;
    }
  }

  // Intelligently merge descriptions based on relevance
  static mergeDescriptions(existing: string, newDesc: string, existingRelevance: number, newRelevance: number): string {
    if (!existing) return newDesc;
    if (!newDesc) return existing;

    // If new description is significantly more relevant, use it
    if (newRelevance > existingRelevance + 0.2) {
      return newDesc;
    }

    // If existing is more relevant, keep it but add unique new information
    if (existingRelevance > newRelevance + 0.1) {
      const uniqueInfo = this.extractUniqueInformation(existing, newDesc);
      return uniqueInfo ? `${existing}. ${uniqueInfo}` : existing;
    }

    // Similar relevance - combine intelligently
    return this.combineDescriptions(existing, newDesc);
  }

  // Extract unique information from new description
  static extractUniqueInformation(existing: string, newDesc: string): string {
    const existingWords = new Set(existing.toLowerCase().split(/\W+/));
    const newWords = newDesc.toLowerCase().split(/\W+/);
    
    // Find sentences in new description that contain significant new information
    const sentences = newDesc.split(/[.!?]+/);
    const uniqueSentences = sentences.filter(sentence => {
      const sentenceWords = sentence.toLowerCase().split(/\W+/);
      const newWordCount = sentenceWords.filter(word => 
        word.length > 3 && !existingWords.has(word)
      ).length;
      return newWordCount >= 2; // Must have at least 2 new significant words
    });

    return uniqueSentences.join('. ').trim();
  }

  // Combine descriptions intelligently
  static combineDescriptions(desc1: string, desc2: string): string {
    // Simple combination for now - could be enhanced with NLP
    const unique2 = this.extractUniqueInformation(desc1, desc2);
    return unique2 ? `${desc1}. ${unique2}` : desc1;
  }

  static async getProjectKnowledge(projectId: string): Promise<KnowledgeBase[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project knowledge:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        details: (item.details as Record<string, any>) || {}
      })) as KnowledgeBase[];
    } catch (error) {
      console.error('Error in getProjectKnowledge:', error);
      return [];
    }
  }

  static async getChapterSummaries(projectId: string): Promise<ChapterSummary[]> {
    try {
      const { data, error } = await supabase
        .from('chapter_summaries')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chapter summaries:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        key_events_in_chapter: (item.key_events_in_chapter as string[]) || [],
        primary_focus: (item.primary_focus as string[]) || []
      })) as ChapterSummary[];
    } catch (error) {
      console.error('Error in getChapterSummaries:', error);
      return [];
    }
  }

  static async getPlotPoints(projectId: string): Promise<PlotPoint[]> {
    try {
      const { data, error } = await supabase
        .from('plot_points')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching plot points:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        characters_involved_names: (item.characters_involved_names as string[]) || [],
        source_chapter_ids: (item.source_chapter_ids as string[]) || []
      })) as PlotPoint[];
    } catch (error) {
      console.error('Error in getPlotPoints:', error);
      return [];
    }
  }

  static async getFlaggedKnowledge(projectId: string): Promise<KnowledgeBase[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_flagged', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching flagged knowledge:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        details: (item.details as Record<string, any>) || {}
      })) as KnowledgeBase[];
    } catch (error) {
      console.error('Error in getFlaggedKnowledge:', error);
      return [];
    }
  }

  static async retryAnalysis(projectId: string, chapterId: string, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Analysis attempt ${attempt}/${maxRetries}`);
        await this.analyzeChapter(projectId, chapterId);
        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.error(`Analysis attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw lastError || new Error('Analysis failed after multiple attempts');
  }

  // Phase 1 Deduplication Methods Implementation

  // Cleanup existing duplicates using conservative deduplication (exact duplicates only)
  static async cleanupExistingDuplicates(projectId: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('conservative_deduplication', {
        p_project_id: projectId
      });

      if (error) {
        console.error('❌ Error with conservative deduplication:', error);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const results = data[0];
        console.log('🧹 Cleanup results:', {
          relationships_removed: results.relationships_removed,
          plot_threads_removed: results.plot_threads_removed,
          timeline_events_removed: results.timeline_events_removed,
          plot_points_removed: results.plot_points_removed,
          chapter_summaries_removed: results.chapter_summaries_removed,
          world_building_removed: results.world_building_removed,
          themes_removed: results.themes_removed
        });
      }
    } catch (error) {
      console.error('❌ Error in cleanup function:', error);
    }
  }

  // Intelligent relationship deduplication and merging
  static async storeOrUpdateRelationship(projectId: string, relationship: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    console.log(`🤝 Processing relationship: ${relationship.character_a_name} - ${relationship.character_b_name} (forceReExtraction: ${forceReExtraction})`);
    console.log('📋 Relationship data:', relationship);
    
    // PHASE 1: Pre-storage semantic similarity checking (SKIP if force re-extraction or gap-filling mode)
    if (!forceReExtraction) {
      console.log('🔍 Checking semantic similarity for relationship...');
      const { SemanticDeduplicationService } = await import('./SemanticDeduplicationService');
      const similarityResult = await SemanticDeduplicationService.checkSemanticSimilarity(
        projectId,
        'character_relationships',
        relationship
      );

      if (similarityResult.hasSimilar && similarityResult.existingItem) {
      console.log(`🔀 Found similar relationship (${similarityResult.similarityScore.toFixed(2)}): ${relationship.character_a_name} - ${relationship.character_b_name}`);
      
      if (similarityResult.suggestedAction === 'merge_with_existing') {
        // Merge with existing item
        const existingRel = similarityResult.existingItem;
        const updateData = {
          relationship_strength: Math.max(existingRel.relationship_strength, relationship.relationship_strength || 5),
          confidence_score: Math.max(existingRel.confidence_score || 0.5, relationship.ai_confidence || 0.5),
          ai_confidence_new: Math.max(existingRel.ai_confidence_new || 0.5, relationship.ai_confidence || 0.5),
          source_chapter_ids: [...new Set([
            ...(existingRel.source_chapter_ids as string[] || []),
            ...sourceChapterIds
          ])],
          evidence: [existingRel.evidence, relationship.evidence].filter(Boolean).join(' | '),
          key_interactions: [...new Set([
            ...(existingRel.key_interactions || []),
            ...(relationship.key_interactions || [])
          ])],
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('character_relationships')
          .update(updateData)
          .eq('id', existingRel.id);

        if (updateError) {
          console.error('Error updating relationship:', updateError);
        } else {
          console.log(`✅ Merged relationship: ${relationship.character_a_name} - ${relationship.character_b_name}`);
        }
         return;
      }
    }
    }

    // Check for existing relationship by character names and type (exact match fallback)
    const { data: existingRelationships, error: searchError } = await supabase
      .from('character_relationships')
      .select('*')
      .eq('project_id', projectId)
      .eq('character_a_name', relationship.character_a_name)
      .eq('character_b_name', relationship.character_b_name)
      .eq('relationship_type', relationship.relationship_type);

    if (searchError) {
      console.error('Error searching for existing relationship:', searchError);
      return;
    }

    if (existingRelationships && existingRelationships.length > 0) {
      // Relationship exists - merge information
      const existingRel = existingRelationships[0];
      
      const updateData = {
        relationship_strength: Math.max(existingRel.relationship_strength, relationship.relationship_strength || 5),
        confidence_score: Math.max(existingRel.confidence_score || 0.5, relationship.ai_confidence || 0.5),
        ai_confidence_new: Math.max(existingRel.ai_confidence_new || 0.5, relationship.ai_confidence || 0.5),
        source_chapter_ids: [...new Set([
          ...(existingRel.source_chapter_ids as string[] || []),
          ...sourceChapterIds
        ])],
        evidence: relationship.evidence || existingRel.evidence,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('character_relationships')
        .update(updateData)
        .eq('id', existingRel.id);

      if (updateError) {
        console.error('Error updating relationship:', updateError);
      } else {
        console.log(`🔄 Updated relationship: ${relationship.character_a_name} - ${relationship.character_b_name}`);
      }
    } else {
      // New relationship - create
      console.log(`📝 Creating new relationship: ${relationship.character_a_name} - ${relationship.character_b_name}`);
      const insertData = {
        project_id: projectId,
        character_a_name: relationship.character_a_name,
        character_b_name: relationship.character_b_name,
        relationship_type: relationship.relationship_type,
        relationship_strength: relationship.relationship_strength || 5,
        confidence_score: relationship.ai_confidence || 0.5,
        extraction_method: 'llm_direct' as const,
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: relationship.ai_confidence || 0.5,
        evidence: relationship.evidence || null
      };
      
      console.log('📋 Insert data for relationship:', insertData);
      
      const { error } = await supabase
        .from('character_relationships')
        .insert(insertData);

      if (error) {
        console.error('Error storing new relationship:', relationship, error);
      } else {
        console.log(`✅ Created new relationship: ${relationship.character_a_name} - ${relationship.character_b_name}`);
      }
    }
  }

  // Intelligent plot thread deduplication and merging
  static async storeOrUpdatePlotThread(projectId: string, plotThread: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    // PHASE 1: Pre-storage semantic similarity checking (skip if force re-extraction)
    if (!forceReExtraction) {
      const { SemanticDeduplicationService } = await import('./SemanticDeduplicationService');
      const similarityResult = await SemanticDeduplicationService.checkSemanticSimilarity(
        projectId,
        'plot_threads',
        plotThread
      );

    if (similarityResult.hasSimilar && similarityResult.existingItem) {
      console.log(`🔀 Found similar plot thread (${similarityResult.similarityScore.toFixed(2)}): ${plotThread.thread_name}`);
      
      if (similarityResult.suggestedAction === 'merge_with_existing') {
        // Merge with existing thread
        const existingThread = similarityResult.existingItem;
        
        const mergedEvents = [...new Set([
          ...(existingThread.key_events as string[] || []),
          ...(plotThread.key_events || [])
        ])];

        const mergedChars = [...new Set([
          ...(existingThread.characters_involved_names as string[] || []),
          ...(plotThread.characters_involved_names || [])
        ])];

        const updateData = {
          thread_status: plotThread.thread_status || existingThread.thread_status,
          key_events: mergedEvents,
          characters_involved_names: mergedChars,
          confidence_score: Math.max(existingThread.confidence_score || 0.5, plotThread.ai_confidence || 0.5),
          ai_confidence_new: Math.max(existingThread.ai_confidence_new || 0.5, plotThread.ai_confidence || 0.5),
          source_chapter_ids: [...new Set([
            ...(existingThread.source_chapter_ids as string[] || []),
            ...sourceChapterIds
          ])],
          evidence: [existingThread.evidence, plotThread.evidence].filter(Boolean).join(' | '),
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('plot_threads')
          .update(updateData)
          .eq('id', existingThread.id);

        if (updateError) {
          console.error('Error updating plot thread:', updateError);
        } else {
          console.log(`✅ Merged plot thread: ${plotThread.thread_name}`);
        }
         return;
      }
    }
    }

    // Check for existing plot thread by name and type (exact match fallback)
    const { data: existingThreads, error: searchError } = await supabase
      .from('plot_threads')
      .select('*')
      .eq('project_id', projectId)
      .eq('thread_name', plotThread.thread_name)
      .eq('thread_type', plotThread.thread_type);

    if (searchError) {
      console.error('Error searching for existing plot thread:', searchError);
      return;
    }

    if (existingThreads && existingThreads.length > 0) {
      // Plot thread exists - merge information
      const existingThread = existingThreads[0];
      
      // Merge key events
      const existingEvents = (existingThread.key_events as string[]) || [];
      const newEvents = plotThread.key_events || [];
      const mergedEvents = [...new Set([...existingEvents, ...newEvents])];

      // Merge characters involved
      const existingChars = (existingThread.characters_involved_names as string[]) || [];
      const newChars = plotThread.characters_involved_names || [];
      const mergedChars = [...new Set([...existingChars, ...newChars])];

      const updateData = {
        thread_status: plotThread.thread_status || existingThread.thread_status,
        key_events: mergedEvents,
        characters_involved_names: mergedChars,
        confidence_score: Math.max(existingThread.confidence_score || 0.5, plotThread.ai_confidence || 0.5),
        ai_confidence_new: Math.max(existingThread.ai_confidence_new || 0.5, plotThread.ai_confidence || 0.5),
        source_chapter_ids: [...new Set([
          ...(existingThread.source_chapter_ids as string[] || []),
          ...sourceChapterIds
        ])],
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('plot_threads')
        .update(updateData)
        .eq('id', existingThread.id);

      if (updateError) {
        console.error('Error updating plot thread:', updateError);
      } else {
        console.log(`🔄 Updated plot thread: ${plotThread.thread_name}`);
      }
    } else {
      // New plot thread - create
      const { error } = await supabase
        .from('plot_threads')
        .insert({
          project_id: projectId,
          thread_name: plotThread.thread_name,
          thread_type: plotThread.thread_type,
          thread_status: plotThread.thread_status,
          key_events: plotThread.key_events || [],
          characters_involved_names: plotThread.characters_involved_names || [],
          confidence_score: plotThread.ai_confidence || 0.5,
          extraction_method: 'llm_direct',
          source_chapter_ids: sourceChapterIds,
          is_newly_extracted: true,
          ai_confidence_new: plotThread.ai_confidence || 0.5
        });

      if (error) {
        console.error('Error storing new plot thread:', plotThread, error);
      } else {
        console.log(`✅ Created new plot thread: ${plotThread.thread_name}`);
      }
    }
  }

  // Intelligent timeline event deduplication and merging
  static async storeOrUpdateTimelineEvent(projectId: string, event: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    const eventName = event.event_name || event.event_summary || 'Unnamed Event';
    
    console.log(`🎯 Processing timeline event: ${eventName} (forceReExtraction: ${forceReExtraction})`);
    console.log('📋 Event data:', { event_name: eventName, event_type: event.event_type, event_summary: event.event_summary });
    
    // PHASE 1: Pre-storage semantic similarity checking (SKIP if force re-extraction or gap-filling mode)
    if (!forceReExtraction) {
      console.log('🔍 Checking semantic similarity for timeline event...');
      const { SemanticDeduplicationService } = await import('./SemanticDeduplicationService');
    const similarityResult = await SemanticDeduplicationService.checkSemanticSimilarity(
      projectId,
      'timeline_events',
      event
    );

    if (similarityResult.hasSimilar && similarityResult.existingItem) {
      console.log(`🔀 Found similar timeline event (${similarityResult.similarityScore.toFixed(2)}): ${eventName}`);
      
      if (similarityResult.suggestedAction === 'merge_with_existing') {
        // Merge with existing event
        const existingEvent = similarityResult.existingItem;
        
        const mergedChars = [...new Set([
          ...(existingEvent.characters_involved_names as string[] || []),
          ...(event.characters_involved_names || [])
        ])];

        const mergedLocs = [...new Set([
          ...(existingEvent.locations_involved_names as string[] || []),
          ...(event.locations_involved_names || [])
        ])];

        const mergedThreads = [...new Set([
          ...(existingEvent.plot_threads_impacted_names as string[] || []),
          ...(event.plot_threads_impacted_names || [])
        ])];

        const updateData = {
          event_description: [existingEvent.event_description, event.event_summary].filter(Boolean).join(' - '),
          event_summary: event.event_summary || existingEvent.event_summary,
          chronological_order: event.chronological_order || existingEvent.chronological_order,
          date_or_time_reference: event.date_or_time_reference || existingEvent.date_or_time_reference,
          significance: [existingEvent.significance, event.significance].filter(Boolean).join(' | '),
          characters_involved_names: mergedChars,
          plot_threads_impacted_names: mergedThreads,
          locations_involved_names: mergedLocs,
          confidence_score: Math.max(existingEvent.confidence_score || 0.5, event.ai_confidence || 0.5),
          ai_confidence_new: Math.max(existingEvent.ai_confidence_new || 0.5, event.ai_confidence || 0.5),
          source_chapter_ids: [...new Set([
            ...(existingEvent.source_chapter_ids as string[] || []),
            ...sourceChapterIds
          ])],
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('timeline_events')
          .update(updateData)
          .eq('id', existingEvent.id);

        if (updateError) {
          console.error('Error updating timeline event:', updateError);
        } else {
          console.log(`✅ Merged timeline event: ${eventName}`);
        }
         return;
      }
    }
    }
    
    // Check for existing timeline event by name and type (exact match fallback)
    const { data: existingEvents, error: searchError } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('project_id', projectId)
      .eq('event_name', eventName)
      .eq('event_type', event.event_type || 'general');

    if (searchError) {
      console.error('Error searching for existing timeline event:', searchError);
      return;
    }

    if (existingEvents && existingEvents.length > 0) {
      // Timeline event exists - merge information
      const existingEvent = existingEvents[0];
      
      // Merge characters involved
      const existingChars = (existingEvent.characters_involved_names as string[]) || [];
      const newChars = event.characters_involved_names || [];
      const mergedChars = [...new Set([...existingChars, ...newChars])];

      // Merge locations involved
      const existingLocs = (existingEvent.locations_involved_names as string[]) || [];
      const newLocs = event.locations_involved_names || [];
      const mergedLocs = [...new Set([...existingLocs, ...newLocs])];

      // Merge plot threads impacted
      const existingThreads = (existingEvent.plot_threads_impacted_names as string[]) || [];
      const newThreads = event.plot_threads_impacted_names || [];
      const mergedThreads = [...new Set([...existingThreads, ...newThreads])];

      const updateData = {
        event_description: event.event_summary || existingEvent.event_description,
        event_summary: event.event_summary || existingEvent.event_summary,
        chronological_order: event.chronological_order || existingEvent.chronological_order,
        date_or_time_reference: event.date_or_time_reference || existingEvent.date_or_time_reference,
        significance: event.significance || existingEvent.significance,
        characters_involved_names: mergedChars,
        plot_threads_impacted_names: mergedThreads,
        locations_involved_names: mergedLocs,
        confidence_score: Math.max(existingEvent.confidence_score || 0.5, event.ai_confidence || 0.5),
        ai_confidence_new: Math.max(existingEvent.ai_confidence_new || 0.5, event.ai_confidence || 0.5),
        source_chapter_ids: [...new Set([
          ...(existingEvent.source_chapter_ids as string[] || []),
          ...sourceChapterIds
        ])],
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('timeline_events')
        .update(updateData)
        .eq('id', existingEvent.id);

      if (updateError) {
        console.error('Error updating timeline event:', updateError);
      } else {
        console.log(`🔄 Updated timeline event: ${eventName}`);
      }
    } else {
      // New timeline event - create
      console.log(`📝 Creating new timeline event: ${eventName}`);
      const insertData = {
        project_id: projectId,
        event_name: eventName,
        event_type: event.event_type || 'general',
        event_description: event.event_summary, // Map event_summary to event_description
        event_summary: event.event_summary,
        chronological_order: event.chronological_order || 0,
        date_or_time_reference: event.date_or_time_reference,
        significance: event.significance,
        characters_involved_names: event.characters_involved_names || [],
        plot_threads_impacted_names: event.plot_threads_impacted_names || [],
        locations_involved_names: event.locations_involved_names || [],
        confidence_score: event.ai_confidence || 0.5,
          extraction_method: 'llm_direct' as const,
        source_chapter_ids: sourceChapterIds,
        is_newly_extracted: true,
        ai_confidence_new: event.ai_confidence || 0.5
      };
      
      console.log('📋 Insert data for timeline event:', insertData);
      
      const { error } = await supabase
        .from('timeline_events')
        .insert(insertData);

      if (error) {
        console.error('Error storing new timeline event:', event, error);
      } else {
        console.log(`✅ Created new timeline event: ${eventName}`);
      }
    }
  }

  // Intelligent plot point deduplication and merging
  static async storeOrUpdatePlotPoint(projectId: string, plotPoint: any, sourceChapterIds: string[], forceReExtraction: boolean = false) {
    // PHASE 1: Pre-storage semantic similarity checking (skip if force re-extraction)
    if (!forceReExtraction) {
      const { SemanticDeduplicationService } = await import('./SemanticDeduplicationService');
      const similarityResult = await SemanticDeduplicationService.checkSemanticSimilarity(
        projectId,
        'plot_points',
        plotPoint
      );

    if (similarityResult.hasSimilar && similarityResult.existingItem) {
      console.log(`🔀 Found similar plot point (${similarityResult.similarityScore.toFixed(2)}): ${plotPoint.name}`);
      
      if (similarityResult.suggestedAction === 'merge_with_existing') {
        // Merge with existing point
        const existingPoint = similarityResult.existingItem;
        
        const mergedChars = [...new Set([
          ...(existingPoint.characters_involved_names as string[] || []),
          ...(plotPoint.characters_involved_names || [])
        ])];

        const updateData = {
          description: [existingPoint.description, plotPoint.description].filter(Boolean).join(' | '),
          significance: [existingPoint.significance, plotPoint.significance].filter(Boolean).join(' | '),
          characters_involved_names: mergedChars,
          ai_confidence: Math.max(existingPoint.ai_confidence || 0.5, plotPoint.ai_confidence || 0.5),
          source_chapter_ids: [...new Set([
            ...(existingPoint.source_chapter_ids as string[] || []),
            ...sourceChapterIds
          ])],
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('plot_points')
          .update(updateData)
          .eq('id', existingPoint.id);

        if (updateError) {
          console.error('Error updating plot point:', updateError);
        } else {
          console.log(`✅ Merged plot point: ${plotPoint.name}`);
        }
         return;
      }
    }
    }

    // Check for existing plot point by name and plot thread (exact match fallback)
    const { data: existingPoints, error: searchError } = await supabase
      .from('plot_points')
      .select('*')
      .eq('project_id', projectId)
      .eq('name', plotPoint.name)
      .eq('plot_thread_name', plotPoint.plot_thread_name || '');

    if (searchError) {
      console.error('Error searching for existing plot point:', searchError);
      return;
    }

    if (existingPoints && existingPoints.length > 0) {
      // Plot point exists - merge information
      const existingPoint = existingPoints[0];
      
      // Merge characters involved
      const existingChars = (existingPoint.characters_involved_names as string[]) || [];
      const newChars = plotPoint.characters_involved_names || [];
      const mergedChars = [...new Set([...existingChars, ...newChars])];

      const updateData = {
        description: plotPoint.description || existingPoint.description,
        significance: plotPoint.significance || existingPoint.significance,
        characters_involved_names: mergedChars,
        ai_confidence: Math.max(existingPoint.ai_confidence || 0.5, plotPoint.ai_confidence || 0.5),
        source_chapter_ids: [...new Set([
          ...(existingPoint.source_chapter_ids as string[] || []),
          ...sourceChapterIds
        ])],
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('plot_points')
        .update(updateData)
        .eq('id', existingPoint.id);

      if (updateError) {
        console.error('Error updating plot point:', updateError);
      } else {
        console.log(`🔄 Updated plot point: ${plotPoint.name}`);
      }
    } else {
      // New plot point - create
      const { error } = await supabase
        .from('plot_points')
        .insert({
          project_id: projectId,
          name: plotPoint.name,
          description: plotPoint.description,
          plot_thread_name: plotPoint.plot_thread_name,
          significance: plotPoint.significance,
          characters_involved_names: plotPoint.characters_involved_names || [],
          ai_confidence: plotPoint.ai_confidence || 0.5,
          source_chapter_ids: sourceChapterIds,
          is_newly_extracted: true
        });

      if (error) {
        console.error('Error storing new plot point:', plotPoint, error);
      } else {
        console.log(`✅ Created new plot point: ${plotPoint.name}`);
      }
    }
  }

  // Intelligent chapter summary deduplication and merging
  static async storeOrUpdateChapterSummary(projectId: string, summary: any, sourceChapters: any[], forceReExtraction: boolean = false) {
    const chapterId = sourceChapters[0]?.id;
    
    // Check for existing chapter summary by chapter ID
    const { data: existingSummaries, error: searchError } = await supabase
      .from('chapter_summaries')
      .select('*')
      .eq('project_id', projectId)
      .eq('chapter_id', chapterId);

    if (searchError) {
      console.error('Error searching for existing chapter summary:', searchError);
      return;
    }

    if (existingSummaries && existingSummaries.length > 0) {
      // Chapter summary exists - merge information
      const existingSummary = existingSummaries[0];
      
      // Merge key events
      const existingEvents = (existingSummary.key_events_in_chapter as string[]) || [];
      const newEvents = summary.key_events_in_chapter || [];
      const mergedEvents = [...new Set([...existingEvents, ...newEvents])];

      // Merge primary focus
      const existingFocus = (existingSummary.primary_focus as string[]) || [];
      const newFocus = summary.primary_focus || [];
      const mergedFocus = [...new Set([...existingFocus, ...newFocus])];

      const updateData = {
        title: summary.title || existingSummary.title,
        summary_short: summary.summary_short || existingSummary.summary_short,
        summary_long: summary.summary_long || existingSummary.summary_long,
        key_events_in_chapter: mergedEvents,
        primary_focus: mergedFocus,
        ai_confidence: Math.max(existingSummary.ai_confidence || 0.5, summary.ai_confidence || 0.5),
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('chapter_summaries')
        .update(updateData)
        .eq('id', existingSummary.id);

      if (updateError) {
        console.error('Error updating chapter summary:', updateError);
      } else {
        console.log(`🔄 Updated chapter summary for chapter: ${chapterId}`);
      }
    } else {
      // New chapter summary - create
      const { error } = await supabase
        .from('chapter_summaries')
        .insert({
          project_id: projectId,
          chapter_id: chapterId,
          title: summary.title,
          summary_short: summary.summary_short,
          summary_long: summary.summary_long,
          key_events_in_chapter: summary.key_events_in_chapter || [],
          primary_focus: summary.primary_focus || [],
          ai_confidence: summary.ai_confidence || 0.5,
          is_newly_extracted: true
        });

      if (error) {
        console.error('Error storing new chapter summary:', summary, error);
      } else {
        console.log(`✅ Created new chapter summary for chapter: ${chapterId}`);
      }
    }
  }
}
