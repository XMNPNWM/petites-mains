import { supabase } from '@/integrations/supabase/client';

export class SemanticDeduplicationService {
  /**
   * Check for semantic similarity before storing new knowledge items
   */
  static async checkSemanticSimilarity(
    projectId: string,
    tableName: string,
    item: any,
    similarityThreshold: number = 0.8
  ): Promise<{
    hasSimilar: boolean;
    similarId?: string;
    similarityScore: number;
    suggestedAction: 'insert_new' | 'merge_with_existing' | 'cluster_with_existing';
  }> {
    try {
      const comparisonData = this.prepareComparisonData(tableName, item);
      
      const { data: similarityResult, error } = await supabase.rpc('check_semantic_similarity', {
        p_project_id: projectId,
        p_table_name: tableName,
        p_comparison_data: comparisonData,
        p_similarity_threshold: similarityThreshold
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
          suggestedAction: result.suggested_action as any
        };
      }

      return {
        hasSimilar: false,
        similarityScore: 0,
        suggestedAction: 'insert_new'
      };
    } catch (error) {
      console.error('Error in semantic similarity check:', error);
      return {
        hasSimilar: false,
        similarityScore: 0,
        suggestedAction: 'insert_new'
      };
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
   * Apply enhanced semantic deduplication to a project
   */
  static async applyEnhancedDeduplication(
    projectId: string,
    similarityThreshold: number = 0.8
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
      console.log(`🧹 Applying enhanced semantic deduplication to project ${projectId}`);
      
      const { data: result, error } = await supabase.rpc('enhanced_semantic_deduplication', {
        p_project_id: projectId,
        p_similarity_threshold: similarityThreshold
      });

      if (error) {
        console.error('Error in enhanced semantic deduplication:', error);
        throw new Error(`Deduplication failed: ${error.message}`);
      }

      if (result && Array.isArray(result) && result.length > 0) {
        const deduplicationResult = result[0];
        console.log('✅ Enhanced semantic deduplication completed:', deduplicationResult);
        
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
      console.error('Enhanced semantic deduplication failed:', error);
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