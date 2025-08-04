import { useState, useEffect } from 'react';
import { KnowledgeSynthesisService } from '@/services/KnowledgeSynthesisService';

interface SynthesizedAIBrainData {
  synthesizedEntities: any[];
  granularRecords: any[];
  sourceAttribution: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
  lastSynthesisAt: Date | null;
}

interface SynthesisActions {
  synthesizeEntity: (category: 'character' | 'world_building' | 'theme', entityName: string) => Promise<void>;
  synthesizeAll: () => Promise<void>;
  refresh: () => Promise<void>;
  getSynthesizedView: (category?: 'character' | 'world_building' | 'theme') => Promise<void>;
}

export const useAIBrainSynthesis = (projectId: string): SynthesizedAIBrainData & SynthesisActions => {
  const [data, setData] = useState<SynthesizedAIBrainData>({
    synthesizedEntities: [],
    granularRecords: [],
    sourceAttribution: {},
    isLoading: false,
    error: null,
    lastSynthesisAt: null
  });

  /**
   * Get synthesized view for a specific category or all categories
   */
  const getSynthesizedView = async (category?: 'character' | 'world_building' | 'theme') => {
    if (!projectId) return;
    
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log(`🧩 Getting synthesized view for project ${projectId}, category: ${category || 'all'}`);
      
      const result = await KnowledgeSynthesisService.getSynthesizedView(projectId, category);
      
      setData(prev => ({
        ...prev,
        synthesizedEntities: result.synthesizedEntities,
        granularRecords: result.granularRecords,
        sourceAttribution: result.sourceAttribution,
        isLoading: false,
        lastSynthesisAt: new Date()
      }));
      
      console.log(`✅ Synthesized view loaded: ${result.synthesizedEntities.length} entities, ${result.granularRecords.length} granular records`);
      
    } catch (error) {
      console.error('❌ Error getting synthesized view:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get synthesized view'
      }));
    }
  };

  /**
   * Synthesize a specific entity
   */
  const synthesizeEntity = async (category: 'character' | 'world_building' | 'theme', entityName: string) => {
    if (!projectId) return;
    
    try {
      console.log(`🧩 Synthesizing entity: ${entityName} (${category})`);
      
      const result = await KnowledgeSynthesisService.synthesizeEntity(projectId, category, entityName);
      
      if (result.success) {
        console.log(`✅ Entity synthesis complete for ${entityName}`);
        // Refresh the synthesized view to show updated data
        await getSynthesizedView();
      } else {
        throw new Error(result.error || 'Synthesis failed');
      }
      
    } catch (error) {
      console.error(`❌ Error synthesizing entity ${entityName}:`, error);
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Entity synthesis failed'
      }));
    }
  };

  /**
   * Synthesize all entities in the project
   */
  const synthesizeAll = async () => {
    if (!projectId) return;
    
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log(`🌍 Starting full project synthesis for project ${projectId}`);
      
      const results = await KnowledgeSynthesisService.synthesizeAllEntities(projectId);
      
      const totalSynthesized = Object.keys(results.characters).length + 
                              Object.keys(results.worldBuilding).length + 
                              Object.keys(results.themes).length;
      
      console.log(`✅ Full synthesis complete. ${totalSynthesized} entities synthesized`);
      
      // Refresh the synthesized view to show all synthesized data
      await getSynthesizedView();
      
    } catch (error) {
      console.error('❌ Error in full synthesis:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Full synthesis failed'
      }));
    }
  };

  /**
   * Refresh the synthesized view (alias for getSynthesizedView)
   */
  const refresh = async () => {
    await getSynthesizedView();
  };

  // Auto-load synthesized view when projectId changes
  useEffect(() => {
    if (projectId) {
      getSynthesizedView();
    }
  }, [projectId]);

  return {
    ...data,
    synthesizeEntity,
    synthesizeAll,
    refresh,
    getSynthesizedView
  };
};