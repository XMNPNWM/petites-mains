import { supabase } from '@/integrations/supabase/client';
import { AIKnowledgeService } from './ai/knowledge/AIKnowledgeService';
import { AIConfigManager } from './ai/core/AIConfigManager';
import { AIErrorHandler } from './ai/core/AIErrorHandler';
import { KnowledgeBase, ChapterSummary, PlotPoint } from '@/types/knowledge';
import { PlotThread, TimelineEvent, CharacterRelationship } from '@/types/ai-brain';

interface SynthesisResult {
  success: boolean;
  synthesizedData?: any;
  aggregatedFromSources?: string[];
  sourceChapterIds?: string[];
  conflictsResolved?: number;
  error?: string;
}

interface EntityGroup {
  entityName: string;
  category: string;
  records: any[];
  sourceChapterIds: string[];
}

export class KnowledgeSynthesisService {
  
  /**
   * Synthesize a specific entity across all chapters
   */
  static async synthesizeEntity(
    projectId: string, 
    category: 'character' | 'world_building' | 'theme', 
    entityName: string
  ): Promise<SynthesisResult> {
    try {
      console.log(`🧩 Starting synthesis for entity: ${entityName} (${category}) in project ${projectId}`);
      
      // Fetch all records for this entity from knowledge_base
      const { data: records, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', category)
        .eq('name', entityName)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (!records || records.length === 0) {
        return { success: false, error: `No records found for ${entityName}` };
      }
      
      if (records.length === 1) {
        console.log(`📝 Only one record found for ${entityName}, no synthesis needed`);
        return { 
          success: true, 
          synthesizedData: records[0],
          aggregatedFromSources: [records[0].id]
        };
      }
      
      console.log(`🔄 Found ${records.length} records for ${entityName}, starting AI synthesis`);
      
      // Group records by source chapters for context
      const sourceChapterIds = records
        .flatMap(r => Array.isArray(r.source_chapter_ids) ? r.source_chapter_ids.map(id => String(id)) : [])
        .filter((id, index, arr) => arr.indexOf(id) === index); // deduplicate
      
      // Build synthesis prompt - include original flag information
      const synthesisData = records.map((record, index) => ({
        recordId: record.id,
        chapterContext: `Record ${index + 1} (from chapter ${record.source_chapter_ids?.[0] || 'unknown'})`,
        name: record.name,
        description: record.description || '',
        subcategory: record.subcategory || '',
        evidence: record.evidence || '',
        details: record.details || {},
        confidence: record.confidence_score || 0.5,
        is_flagged: record.is_flagged || false,
        is_verified: record.is_verified || false
      }));
      
      const synthesizedResult = await this.performAISynthesis(category, entityName, synthesisData);
      
      return {
        success: true,
        synthesizedData: synthesizedResult,
        aggregatedFromSources: records.map(r => r.id),
        sourceChapterIds: sourceChapterIds
      };
      
    } catch (error) {
      console.error(`❌ Error synthesizing entity ${entityName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Synthesis failed'
      };
    }
  }
  
  /**
   * Synthesize all entities for a project
   */
  static async synthesizeAllEntities(projectId: string): Promise<{
    characters: Record<string, SynthesisResult>;
    worldBuilding: Record<string, SynthesisResult>;
    themes: Record<string, SynthesisResult>;
  }> {
    console.log(`🌍 Starting full project synthesis for project ${projectId}`);
    
    const results = {
      characters: {} as Record<string, SynthesisResult>,
      worldBuilding: {} as Record<string, SynthesisResult>,
      themes: {} as Record<string, SynthesisResult>
    };
    
    try {
      // Get all unique entity names by category
      const entityGroups = await this.getEntityGroups(projectId);
      
      // Synthesize characters
      for (const group of entityGroups.filter(g => g.category === 'character')) {
        const result = await this.synthesizeEntity(projectId, 'character', group.entityName);
        results.characters[group.entityName] = result;
      }
      
      // Synthesize world building elements
      for (const group of entityGroups.filter(g => g.category === 'world_building')) {
        const result = await this.synthesizeEntity(projectId, 'world_building', group.entityName);
        results.worldBuilding[group.entityName] = result;
      }
      
      // Synthesize themes
      for (const group of entityGroups.filter(g => g.category === 'theme')) {
        const result = await this.synthesizeEntity(projectId, 'theme', group.entityName);
        results.themes[group.entityName] = result;
      }
      
      console.log(`✅ Full synthesis complete. Characters: ${Object.keys(results.characters).length}, World Building: ${Object.keys(results.worldBuilding).length}, Themes: ${Object.keys(results.themes).length}`);
      
    } catch (error) {
      console.error('❌ Error in full project synthesis:', error);
    }
    
    return results;
  }
  
  /**
   * Get synthesized view for AI Brain interface
   */
  static async getSynthesizedView(
    projectId: string, 
    category?: 'character' | 'world_building' | 'theme'
  ): Promise<{
    synthesizedEntities: any[];
    granularRecords: any[];
    sourceAttribution: Record<string, string[]>;
  }> {
    try {
      console.log(`📊 Getting synthesized view for project ${projectId}, category: ${category || 'all'}`);
      
      // Get entity groups
      const entityGroups = await this.getEntityGroups(projectId, category);
      
      const synthesizedEntities = [];
      const granularRecords = [];
      const sourceAttribution: Record<string, string[]> = {};
      
      for (const group of entityGroups) {
        // Add granular records
        granularRecords.push(...group.records);
        
        // Synthesize if multiple records exist
        if (group.records.length > 1) {
          const synthesisResult = await this.synthesizeEntity(projectId, group.category as any, group.entityName);
          if (synthesisResult.success && synthesisResult.synthesizedData) {
            synthesizedEntities.push({
              ...synthesisResult.synthesizedData,
              _synthesis_meta: {
                entityName: group.entityName,
                recordCount: group.records.length,
                sourceRecordIds: group.records.map(r => r.id),
                sourceChapterIds: group.sourceChapterIds
              }
            });
            sourceAttribution[group.entityName] = group.records.map(r => r.id);
          }
        } else {
          // Single record, add as-is with synthesis meta
          synthesizedEntities.push({
            ...group.records[0],
            _synthesis_meta: {
              entityName: group.entityName,
              recordCount: 1,
              sourceRecordIds: [group.records[0].id],
              sourceChapterIds: group.sourceChapterIds
            }
          });
          sourceAttribution[group.entityName] = [group.records[0].id];
        }
      }
      
      return {
        synthesizedEntities,
        granularRecords,
        sourceAttribution
      };
      
    } catch (error) {
      console.error('❌ Error getting synthesized view:', error);
      return {
        synthesizedEntities: [],
        granularRecords: [],
        sourceAttribution: {}
      };
    }
  }
  
  /**
   * Group entities by name within each category
   */
  private static async getEntityGroups(
    projectId: string, 
    category?: 'character' | 'world_building' | 'theme'
  ): Promise<EntityGroup[]> {
    const query = supabase
      .from('knowledge_base')
      .select('*')
      .eq('project_id', projectId);
    
    if (category) {
      query.eq('category', category);
    } else {
      query.in('category', ['character', 'world_building', 'theme']);
    }
    
    const { data: records, error } = await query.order('created_at', { ascending: true });
    
    if (error) throw error;
    if (!records) return [];
    
    // Group by category and entity name (exact matching)
    // NOTE: Future Phase 3 enhancement - integrate semantic matching here
    // Replace exact name matching with embeddings-based similarity matching
    // to group entities like "John Smith" and "J. Smith" together
    const groupMap = new Map<string, EntityGroup>();
    
    records.forEach(record => {
      const key = `${record.category}:${record.name}`; // TODO: Replace with semantic grouping key
      
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          entityName: record.name,
          category: record.category,
          records: [],
          sourceChapterIds: []
        });
      }
      
      const group = groupMap.get(key)!;
      group.records.push(record);
      
      // Collect unique source chapter IDs
      const chapterIds = Array.isArray(record.source_chapter_ids) ? record.source_chapter_ids : [];
      chapterIds.forEach(id => {
        const idStr = typeof id === 'string' ? id : String(id);
        if (!group.sourceChapterIds.includes(idStr)) {
          group.sourceChapterIds.push(idStr);
        }
      });
    });
    
    return Array.from(groupMap.values());
  }
  
  /**
   * Perform AI-powered synthesis of multiple records
   */
  private static async performAISynthesis(
    category: string,
    entityName: string,
    records: any[]
  ): Promise<any> {
    const synthesisPrompt = this.buildSynthesisPrompt(category, entityName, records);
    
    try {
      const response = await AIErrorHandler.withRetry(async () => {
        const model = AIConfigManager.getModel('analysis');
        const aiClient = (AIKnowledgeService as any).aiClient;
        return await aiClient.generateContent(model, synthesisPrompt);
      }, `Knowledge synthesis for ${entityName}`);
      
      // Parse and validate AI response
      const synthesizedData = JSON.parse(response.content);
      
      // Aggregate flags from source records
      const aggregatedIsFlagged = records.some(r => r.is_flagged);
      const aggregatedIsVerified = records.every(r => r.is_verified); // Strict: all must be verified
      
      // Deduplicate source chapter IDs
      const sourceChapterIds = records.flatMap(r => (r.source_chapter_ids || []).map(id => String(id)));
      const deduplicatedSourceChapterIds = [...new Set(sourceChapterIds)];
      
      // Add synthesis metadata
      return {
        ...synthesizedData,
        name: entityName,
        category: category,
        confidence_score: Math.max(...records.map(r => r.confidence || 0.5)),
        extraction_method: 'ai_synthesis',
        is_verified: aggregatedIsVerified,
        is_flagged: aggregatedIsFlagged,
        source_chapter_ids: deduplicatedSourceChapterIds,
        synthesis_source_count: records.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Enhanced synthesis metadata
        _synthesis_meta: {
          source_record_count: records.length,
          source_record_ids: records.map(r => r.recordId),
          synthesis_timestamp: new Date().toISOString(),
          ai_model: AIConfigManager.getModel('analysis'),
          aggregated_is_flagged: aggregatedIsFlagged,
          aggregated_is_verified: aggregatedIsVerified,
          individual_flags: records.map(r => ({
            record_id: r.recordId,
            is_flagged: r.is_flagged || false,
            is_verified: r.is_verified || false
          }))
        }
      };
      
    } catch (error) {
      console.error(`❌ AI synthesis failed for ${entityName}:`, error);
      throw error;
    }
  }
  
  /**
   * Build synthesis prompt for AI
   */
  private static buildSynthesisPrompt(category: string, entityName: string, records: any[]): string {
    const categoryInstructions = {
      character: `Create a comprehensive character profile that synthesizes all the information from different chapters. Merge descriptions, traits, and evidence without repetition. Focus on character development, abilities, relationships, and key characteristics.`,
      world_building: `Create a comprehensive world-building entry that combines all location, setting, or world element details from different chapters. Merge descriptions and evidence to create a complete picture of this world element.`,
      theme: `Create a comprehensive theme analysis that synthesizes how this theme appears and develops across different chapters. Merge evidence and descriptions to show the theme's evolution and significance.`
    };
    
    const recordsText = records.map((record, index) => 
      `\n--- ${record.chapterContext} ---
Name: ${record.name}
Description: ${record.description}
Subcategory: ${record.subcategory}
Evidence: ${record.evidence}
Details: ${JSON.stringify(record.details, null, 2)}
Confidence: ${record.confidence}`
    ).join('\n');
    
    return `${categoryInstructions[category]}

Entity Name: ${entityName}
Category: ${category}

Source Records to Synthesize:
${recordsText}

Instructions:
1. Create a comprehensive, non-repetitive synthesis that combines all unique information
2. Preserve all important details from each source record
3. Resolve any conflicts by noting variations or evolution across chapters
4. Maintain evidence traceability by combining all evidence sources
5. Return ONLY a JSON object with these fields:
   - description: Comprehensive description combining all sources
   - subcategory: Most appropriate subcategory 
   - evidence: Combined evidence from all sources
   - details: Merged details object with all unique information
   - reasoning: Brief explanation of how the synthesis was performed
   - conflicts_resolved: Array of any conflicts found and how they were resolved

Return valid JSON only:`;
  }
}