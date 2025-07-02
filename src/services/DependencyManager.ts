
import { supabase } from '@/integrations/supabase/client';

export interface DependencyRelation {
  id: string;
  source_content_id: string;
  source_content_type: string;
  dependent_content_id: string;
  dependent_content_type: string;
  dependency_type: string;
  strength: number;
  created_at: string;
}

export class DependencyManager {
  static async createDependency(
    sourceId: string,
    sourceType: string,
    dependentId: string,
    dependentType: string,
    dependencyType: string,
    strength: number = 0.5
  ): Promise<DependencyRelation> {
    console.log(`🔗 Creating dependency: ${sourceType}:${sourceId} -> ${dependentType}:${dependentId}`);

    const { data, error } = await supabase
      .from('dependency_graph')
      .insert({
        source_content_id: sourceId,
        source_content_type: sourceType,
        dependent_content_id: dependentId,
        dependent_content_type: dependentType,
        dependency_type: dependencyType,
        strength
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getDependents(
    contentId: string,
    contentType: string
  ): Promise<DependencyRelation[]> {
    const { data, error } = await supabase
      .from('dependency_graph')
      .select('*')
      .eq('source_content_id', contentId)
      .eq('source_content_type', contentType);

    if (error) throw error;
    return data || [];
  }

  static async getDependencies(
    contentId: string,
    contentType: string
  ): Promise<DependencyRelation[]> {
    const { data, error } = await supabase
      .from('dependency_graph')
      .select('*')
      .eq('dependent_content_id', contentId)
      .eq('dependent_content_type', contentType);

    if (error) throw error;
    return data || [];
  }

  static async getRequiredReprocessing(changedContentIds: string[]): Promise<string[]> {
    console.log(`🔄 Finding content that needs reprocessing due to changes in:`, changedContentIds);

    if (changedContentIds.length === 0) return [];

    // Get all content that depends on the changed content
    const { data, error } = await supabase
      .from('dependency_graph')
      .select('dependent_content_id')
      .in('source_content_id', changedContentIds);

    if (error) {
      console.error('Error getting dependent content:', error);
      return [];
    }

    const dependentIds = data?.map(d => d.dependent_content_id) || [];
    
    // Remove duplicates and return
    return [...new Set([...changedContentIds, ...dependentIds])];
  }

  static async invalidateDownstream(contentId: string, contentType: string): Promise<void> {
    console.log(`❌ Invalidating downstream dependencies for ${contentType}:${contentId}`);

    const dependents = await this.getDependents(contentId, contentType);
    
    // For now, we'll just log what would be invalidated
    // In a full implementation, this would trigger reanalysis
    for (const dependent of dependents) {
      console.log(`  - Would invalidate ${dependent.dependent_content_type}:${dependent.dependent_content_id}`);
    }
  }

  static async removeDependency(
    sourceId: string,
    dependentId: string,
    dependencyType: string
  ): Promise<void> {
    const { error } = await supabase
      .from('dependency_graph')
      .delete()
      .eq('source_content_id', sourceId)
      .eq('dependent_content_id', dependentId)
      .eq('dependency_type', dependencyType);

    if (error) throw error;
  }

  static async getProjectDependencyGraph(projectId: string): Promise<DependencyRelation[]> {
    // Get all dependencies for chapters in this project
    const { data, error } = await supabase
      .from('dependency_graph')
      .select(`
        *,
        chapters!dependency_graph_source_content_id_fkey(project_id),
        chapters!dependency_graph_dependent_content_id_fkey(project_id)
      `)
      .or(`chapters.project_id.eq.${projectId},chapters.project_id.eq.${projectId}`);

    if (error) {
      console.error('Error fetching project dependency graph:', error);
      return [];
    }

    return data || [];
  }
}
