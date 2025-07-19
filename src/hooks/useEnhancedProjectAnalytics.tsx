import { useMemo } from 'react';
import { 
  calculateWritingVelocity, 
  generateHeatmapData, 
  calculateContentBreakdown, 
  analyzeWritingPatterns 
} from '@/lib/analyticsUtils';
import { calculateEnhancedAnalytics, EnhancedAnalyticsData } from '@/lib/enhancedAnalyticsUtils';

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
  worldElementsByType: WorldbuildingElementsByType
) => {
  const analytics = useMemo(() => {
    // Keep existing analytics for compatibility
    const velocityData = calculateWritingVelocity(chapters, 30);
    const heatmapData = generateHeatmapData(chapters, totalWorldElements);
    const contentBreakdown = calculateContentBreakdown(chapters, worldElementsByType);
    const writingPatterns = analyzeWritingPatterns(chapters);
    
    // Add enhanced analytics
    const enhancedAnalytics = calculateEnhancedAnalytics(chapters, totalWorldElements, worldElementsByType);

    return {
      // Existing analytics (preserved for compatibility)
      velocityData,
      heatmapData,
      contentBreakdown,
      writingPatterns,
      
      // Enhanced analytics
      enhanced: enhancedAnalytics
    };
  }, [chapters, totalWorldElements, worldElementsByType]);

  return analytics;
};
