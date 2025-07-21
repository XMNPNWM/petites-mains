
import { useMemo } from 'react';
import { 
  calculateWritingVelocity, 
  generateHeatmapData, 
  calculateContentBreakdown, 
  analyzeWritingPatterns,
  calculateAIBrainBreakdown
} from '@/lib/analyticsUtils';
import { calculateEnhancedAnalytics, EnhancedAnalyticsData } from '@/lib/enhancedAnalyticsUtils';
import { useAIBrainData } from './useAIBrainData';

interface Chapter {
  id: string;
  title: string;
  word_count: number;
  status: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface WorldbuildingElementsByType {
  [type: string]: number;
}

export const useEnhancedProjectAnalytics = (
  chapters: Chapter[], 
  totalWorldElements: number, 
  worldElementsByType: WorldbuildingElementsByType,
  projectId?: string
) => {
  // Fetch AI brain data if projectId is provided
  const aiBrainData = useAIBrainData(projectId || '');

  const analytics = useMemo(() => {
    // Keep existing analytics for compatibility
    const velocityData = calculateWritingVelocity(chapters, 30);
    const heatmapData = generateHeatmapData(chapters, totalWorldElements);
    const contentBreakdown = calculateContentBreakdown(chapters, worldElementsByType);
    const writingPatterns = analyzeWritingPatterns(chapters);
    
    // Add enhanced analytics
    const enhancedAnalytics = calculateEnhancedAnalytics(chapters, totalWorldElements, worldElementsByType);

    // Calculate AI brain breakdown only if we have projectId and AI brain data
    let aiBrainBreakdown = [];
    if (projectId && !aiBrainData.isLoading && !aiBrainData.error) {
      aiBrainBreakdown = calculateAIBrainBreakdown(
        aiBrainData.knowledge,
        aiBrainData.chapterSummaries,
        aiBrainData.plotPoints,
        aiBrainData.plotThreads,
        aiBrainData.timelineEvents,
        aiBrainData.characterRelationships,
        aiBrainData.worldBuilding,
        aiBrainData.themes
      );
    }

    return {
      // Existing analytics (preserved for compatibility)
      velocityData,
      heatmapData,
      contentBreakdown,
      writingPatterns,
      
      // Enhanced analytics
      enhanced: enhancedAnalytics,
      
      // AI brain breakdown
      aiBrainBreakdown
    };
  }, [chapters, totalWorldElements, worldElementsByType, projectId, aiBrainData]);

  return analytics;
};
