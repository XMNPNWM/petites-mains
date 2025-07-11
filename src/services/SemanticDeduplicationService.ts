import { supabase } from '@/integrations/supabase/client';

export class SemanticDeduplicationService {
  /**
   * Content-specific similarity thresholds
   */
  private static readonly SIMILARITY_THRESHOLDS = {
    character_relationships: 0.85,
    timeline_events: 0.75,
    plot_threads: 0.9,
    plot_points: 0.8,
    knowledge_base: 0.7,
    chapter_summaries: 0.8
  };

  /**
   * Check for semantic similarity before storing new knowledge items
   */
  static async checkSemanticSimilarity(
    projectId: string,
    tableName: string,
    item: any,
    similarityThreshold?: number
  ): Promise<{
    hasSimilar: boolean;
    similarId?: string;
    similarityScore: number;
    suggestedAction: 'insert_new' | 'merge_with_existing' | 'cluster_with_existing';
    existingItem?: any;
  }> {
    try {
      // Use content-specific threshold if not provided
      const threshold = similarityThreshold || this.SIMILARITY_THRESHOLDS[tableName as keyof typeof this.SIMILARITY_THRESHOLDS] || 0.8;
      
      // First, try incremental optimization - only check against related items
      const existingItem = await this.findSimilarItem(projectId, tableName, item, threshold);
      
      if (existingItem) {
        const similarityScore = this.calculateSimilarityScore(tableName, item, existingItem);
        const suggestedAction = this.determineSuggestedAction(similarityScore, threshold);
        
        return {
          hasSimilar: true,
          similarId: existingItem.id,
          similarityScore,
          suggestedAction,
          existingItem
        };
      }

      const comparisonData = this.prepareComparisonData(tableName, item);
      
      const { data: similarityResult, error } = await supabase.rpc('check_semantic_similarity', {
        p_project_id: projectId,
        p_table_name: tableName,
        p_comparison_data: comparisonData,
        p_similarity_threshold: threshold
      });

      if (error) {
        console.error('Error checking semantic similarity:', error);
        return {
          hasSimilar: false,
          similarityScore: 0,
          suggestedAction: 'insert_new'
        };
      }

      if (similarityResult && similarityResult.length > 0) {
        const result = similarityResult[0];
        return {
          hasSimilar: result.has_similar,
          similarId: result.similar_id,
          similarityScore: result.similarity_score,
          suggestedAction: result.suggested_action as any,
          existingItem: null
        };
      }

      return {
        hasSimilar: false,
        similarityScore: 0,
        suggestedAction: 'insert_new',
        existingItem: null
      };
    } catch (error) {
      console.error('Error in semantic similarity check:', error);
      return {
        hasSimilar: false,
        similarityScore: 0,
        suggestedAction: 'insert_new',
        existingItem: null
      };
    }
  }

  /**
   * Find similar items using incremental optimization (check only related items)
   */
  private static async findSimilarItem(projectId: string, tableName: string, item: any, threshold: number): Promise<any> {
    try {
      switch (tableName) {
        case 'character_relationships':
          return await this.findSimilarRelationship(projectId, item, threshold);
        case 'timeline_events':
          return await this.findSimilarTimelineEvent(projectId, item, threshold);
        case 'plot_threads':
          return await this.findSimilarPlotThread(projectId, item, threshold);
        case 'plot_points':
          return await this.findSimilarPlotPoint(projectId, item, threshold);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error finding similar ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Find similar relationship using smart filtering
   */
  private static async findSimilarRelationship(projectId: string, item: any, threshold: number): Promise<any> {
    const { data: candidates } = await supabase
      .from('character_relationships')
      .select('*')
      .eq('project_id', projectId)
      .or(`character_a_name.ilike.%${item.character_a_name}%,character_b_name.ilike.%${item.character_a_name}%`)
      .or(`character_a_name.ilike.%${item.character_b_name}%,character_b_name.ilike.%${item.character_b_name}%`);

    return this.findBestMatch(candidates || [], item, threshold, 'character_relationships');
  }

  /**
   * Find similar timeline event using smart filtering
   */
  private static async findSimilarTimelineEvent(projectId: string, item: any, threshold: number): Promise<any> {
    const eventNameWords = (item.event_name || item.event_summary || '').toLowerCase().split(' ').slice(0, 3);
    const searchPattern = eventNameWords.join(' & ');
    
    const { data: candidates } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('project_id', projectId)
      .eq('event_type', item.event_type || 'general')
      .textSearch('event_name', searchPattern);

    return this.findBestMatch(candidates || [], item, threshold, 'timeline_events');
  }

  /**
   * Find similar plot thread using smart filtering
   */
  private static async findSimilarPlotThread(projectId: string, item: any, threshold: number): Promise<any> {
    const { data: candidates } = await supabase
      .from('plot_threads')
      .select('*')
      .eq('project_id', projectId)
      .eq('thread_type', item.thread_type)
      .ilike('thread_name', `%${item.thread_name}%`);

    return this.findBestMatch(candidates || [], item, threshold, 'plot_threads');
  }

  /**
   * Find similar plot point using smart filtering
   */
  private static async findSimilarPlotPoint(projectId: string, item: any, threshold: number): Promise<any> {
    const { data: candidates } = await supabase
      .from('plot_points')
      .select('*')
      .eq('project_id', projectId)
      .eq('plot_thread_name', item.plot_thread_name || '')
      .ilike('name', `%${item.name}%`);

    return this.findBestMatch(candidates || [], item, threshold, 'plot_points');
  }

  /**
   * Find the best matching item from candidates
   */
  private static findBestMatch(candidates: any[], item: any, threshold: number, contentType: string): any {
    let bestMatch = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = this.calculateSimilarityScore(contentType, item, candidate);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate similarity score between two items
   */
  private static calculateSimilarityScore(contentType: string, item1: any, item2: any): number {
    switch (contentType) {
      case 'character_relationships':
        return this.calculateRelationshipSimilarity(item1, item2);
      case 'timeline_events':
        return this.calculateTimelineEventSimilarity(item1, item2);
      case 'plot_threads':
        return this.calculatePlotThreadSimilarity(item1, item2);
      case 'plot_points':
        return this.calculatePlotPointSimilarity(item1, item2);
      default:
        return 0;
    }
  }

  /**
   * Calculate relationship similarity
   */
  private static calculateRelationshipSimilarity(rel1: any, rel2: any): number {
    let score = 0;
    
    // Character names match (exact or swapped)
    if ((rel1.character_a_name === rel2.character_a_name && rel1.character_b_name === rel2.character_b_name) ||
        (rel1.character_a_name === rel2.character_b_name && rel1.character_b_name === rel2.character_a_name)) {
      score += 0.6;
    }
    
    // Relationship type similarity
    if (rel1.relationship_type === rel2.relationship_type) {
      score += 0.4;
    } else if (rel1.relationship_type && rel2.relationship_type && 
               rel1.relationship_type.toLowerCase().includes(rel2.relationship_type.toLowerCase())) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate timeline event similarity
   */
  private static calculateTimelineEventSimilarity(event1: any, event2: any): number {
    let score = 0;
    
    // Event type match
    if (event1.event_type === event2.event_type) {
      score += 0.3;
    }
    
    // Event name/summary similarity
    const name1 = (event1.event_name || event1.event_summary || '').toLowerCase();
    const name2 = (event2.event_name || event2.event_summary || '').toLowerCase();
    
    if (name1 === name2) {
      score += 0.5;
    } else if (name1.includes(name2) || name2.includes(name1)) {
      score += 0.3;
    }
    
    // Character overlap
    const chars1 = event1.characters_involved_names || [];
    const chars2 = event2.characters_involved_names || [];
    const charOverlap = chars1.filter((c: string) => chars2.includes(c)).length;
    if (chars1.length > 0 && chars2.length > 0) {
      score += (charOverlap / Math.max(chars1.length, chars2.length)) * 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate plot thread similarity
   */
  private static calculatePlotThreadSimilarity(thread1: any, thread2: any): number {
    let score = 0;
    
    // Thread type match
    if (thread1.thread_type === thread2.thread_type) {
      score += 0.4;
    }
    
    // Thread name similarity
    const name1 = (thread1.thread_name || '').toLowerCase();
    const name2 = (thread2.thread_name || '').toLowerCase();
    
    if (name1 === name2) {
      score += 0.6;
    } else if (name1.includes(name2) || name2.includes(name1)) {
      score += 0.4;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate plot point similarity
   */
  private static calculatePlotPointSimilarity(point1: any, point2: any): number {
    let score = 0;
    
    // Plot thread match
    if (point1.plot_thread_name === point2.plot_thread_name) {
      score += 0.3;
    }
    
    // Name similarity
    const name1 = (point1.name || '').toLowerCase();
    const name2 = (point2.name || '').toLowerCase();
    
    if (name1 === name2) {
      score += 0.7;
    } else if (name1.includes(name2) || name2.includes(name1)) {
      score += 0.5;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Determine suggested action based on similarity score and threshold
   */
  private static determineSuggestedAction(similarityScore: number, threshold: number): 'insert_new' | 'merge_with_existing' | 'cluster_with_existing' {
    if (similarityScore >= 0.9) {
      return 'merge_with_existing';
    } else if (similarityScore >= threshold) {
      return 'cluster_with_existing';
    } else {
      return 'insert_new';
    }
  }

  /**
   * Prepare comparison data for different table types
   */
  private static prepareComparisonData(tableName: string, item: any): any {
    switch (tableName) {
      case 'character_relationships':
        return {
          character_a_name: item.character_a_name,
          character_b_name: item.character_b_name,
          relationship_type: item.relationship_type
        };
      
      case 'timeline_events':
        return {
          event_summary: item.event_summary,
          event_type: item.event_type,
          event_name: item.event_name || item.event_summary
        };
      
      case 'plot_threads':
        return {
          thread_name: item.thread_name,
          thread_type: item.thread_type
        };
      
      case 'plot_points':
        return {
          name: item.name,
          plot_thread_name: item.plot_thread_name
        };
      
      case 'knowledge_base':
        return {
          name: item.name,
          category: item.category,
          subcategory: item.subcategory
        };
      
      default:
        return item;
    }
  }

  /**
   * Apply conservative deduplication to a project (only removes exact duplicates)
   */
  static async applyConservativeDeduplication(
    projectId: string
  ): Promise<{
    relationshipsRemoved: number;
    plotThreadsRemoved: number;
    timelineEventsRemoved: number;
    plotPointsRemoved: number;
    chapterSummariesRemoved: number;
    worldBuildingRemoved: number;
    themesRemoved: number;
    semanticMergesPerformed: number;
  }> {
    try {
      console.log(`🧹 Applying conservative deduplication to project ${projectId}`);
      
      const { data: result, error } = await supabase.rpc('conservative_deduplication', {
        p_project_id: projectId
      });

      if (error) {
        console.error('Error in conservative deduplication:', error);
        throw new Error(`Deduplication failed: ${error.message}`);
      }

      if (result && Array.isArray(result) && result.length > 0) {
        const deduplicationResult = result[0];
        console.log('✅ Conservative deduplication completed:', deduplicationResult);
        
        return {
          relationshipsRemoved: deduplicationResult.relationships_removed || 0,
          plotThreadsRemoved: deduplicationResult.plot_threads_removed || 0,
          timelineEventsRemoved: deduplicationResult.timeline_events_removed || 0,
          plotPointsRemoved: deduplicationResult.plot_points_removed || 0,
          chapterSummariesRemoved: deduplicationResult.chapter_summaries_removed || 0,
          worldBuildingRemoved: deduplicationResult.world_building_removed || 0,
          themesRemoved: deduplicationResult.themes_removed || 0,
          semanticMergesPerformed: deduplicationResult.semantic_merges_performed || 0
        };
      }

      return {
        relationshipsRemoved: 0,
        plotThreadsRemoved: 0,
        timelineEventsRemoved: 0,
        plotPointsRemoved: 0,
        chapterSummariesRemoved: 0,
        worldBuildingRemoved: 0,
        themesRemoved: 0,
        semanticMergesPerformed: 0
      };
    } catch (error) {
      console.error('Conservative deduplication failed:', error);
      throw error;
    }
  }

  /**
   * Merge similar items with intelligent combining of information
   */
  static async mergeItemsIntelligently(
    tableName: string,
    primaryId: string,
    similarId: string,
    primaryItem: any,
    similarItem: any
  ): Promise<boolean> {
    try {
      console.log(`🔀 Merging ${tableName} items: ${primaryId} with ${similarId}`);

      switch (tableName) {
        case 'character_relationships':
          return await this.mergeRelationships(primaryId, similarId, primaryItem, similarItem);
        
        case 'timeline_events':
          return await this.mergeTimelineEvents(primaryId, similarId, primaryItem, similarItem);
        
        default:
          console.warn(`Merging not implemented for table: ${tableName}`);
          return false;
      }
    } catch (error) {
      console.error('Error merging items:', error);
      return false;
    }
  }

  /**
   * Merge character relationships
   */
  private static async mergeRelationships(
    primaryId: string,
    similarId: string,
    primaryItem: any,
    similarItem: any
  ): Promise<boolean> {
    try {
      // Combine evidence and interactions
      const combinedEvidence = [
        primaryItem.evidence,
        similarItem.evidence
      ].filter(Boolean).join(' | ');

      const combinedInteractions = [
        ...(primaryItem.key_interactions || []),
        ...(similarItem.key_interactions || [])
      ];

      // Update primary item with merged data
      const { error } = await supabase
        .from('character_relationships')
        .update({
          evidence: combinedEvidence,
          key_interactions: combinedInteractions,
          relationship_strength: Math.max(primaryItem.relationship_strength || 0, similarItem.relationship_strength || 0),
          confidence_score: Math.max(primaryItem.confidence_score || 0, similarItem.confidence_score || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', primaryId);

      if (error) {
        console.error('Error updating primary relationship:', error);
        return false;
      }

      // Delete similar item
      const { error: deleteError } = await supabase
        .from('character_relationships')
        .delete()
        .eq('id', similarId);

      if (deleteError) {
        console.error('Error deleting similar relationship:', deleteError);
        return false;
      }

      console.log(`✅ Successfully merged relationships: ${primaryId} with ${similarId}`);
      return true;
    } catch (error) {
      console.error('Error in relationship merge:', error);
      return false;
    }
  }

  /**
   * Merge timeline events
   */
  private static async mergeTimelineEvents(
    primaryId: string,
    similarId: string,
    primaryItem: any,
    similarItem: any
  ): Promise<boolean> {
    try {
      // Create comprehensive event summary
      const combinedSummary = `${primaryItem.event_summary} - ${similarItem.event_summary}`;
      const combinedSignificance = [
        primaryItem.significance,
        similarItem.significance
      ].filter(Boolean).join(' | ');

      const combinedCharacters = Array.from(new Set([
        ...(primaryItem.characters_involved_names || []),
        ...(similarItem.characters_involved_names || [])
      ]));

      // Update primary item with merged data
      const { error } = await supabase
        .from('timeline_events')
        .update({
          event_name: `${primaryItem.event_name || primaryItem.event_summary} (séquence complète)`,
          event_summary: combinedSummary,
          significance: combinedSignificance,
          characters_involved_names: combinedCharacters,
          confidence_score: Math.max(primaryItem.confidence_score || 0, similarItem.confidence_score || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', primaryId);

      if (error) {
        console.error('Error updating primary timeline event:', error);
        return false;
      }

      // Delete similar item
      const { error: deleteError } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', similarId);

      if (deleteError) {
        console.error('Error deleting similar timeline event:', deleteError);
        return false;
      }

      console.log(`✅ Successfully merged timeline events: ${primaryId} with ${similarId}`);
      return true;
    } catch (error) {
      console.error('Error in timeline event merge:', error);
      return false;
    }
  }
}