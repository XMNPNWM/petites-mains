
import { useMemo } from 'react';
import { 
  calculateWritingVelocity, 
  generateHeatmapData, 
  calculateContentBreakdown, 
  analyzeWritingPatterns 
} from '@/lib/analyticsUtils';

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

export const useProjectAnalytics = (
  chapters: Chapter[], 
  totalWorldElements: number, 
  worldElementsByType: WorldbuildingElementsByType
) => {
  const analytics = useMemo(() => {
    const velocityData = calculateWritingVelocity(chapters, 30);
    const heatmapData = generateHeatmapData(chapters, totalWorldElements);
    const contentBreakdown = calculateContentBreakdown(chapters, worldElementsByType);
    const writingPatterns = analyzeWritingPatterns(chapters);

    return {
      velocityData,
      heatmapData,
      contentBreakdown,
      writingPatterns
    };
  }, [chapters, totalWorldElements, worldElementsByType]);

  return analytics;
};
