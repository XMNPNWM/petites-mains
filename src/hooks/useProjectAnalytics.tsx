
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

export const useProjectAnalytics = (
  chapters: Chapter[], 
  totalWorldElements: number, 
  totalCharacters: number
) => {
  const analytics = useMemo(() => {
    const velocityData = calculateWritingVelocity(chapters, 30);
    const heatmapData = generateHeatmapData(chapters, totalWorldElements);
    const contentBreakdown = calculateContentBreakdown(chapters, totalWorldElements, totalCharacters);
    const writingPatterns = analyzeWritingPatterns(chapters);

    return {
      velocityData,
      heatmapData,
      contentBreakdown,
      writingPatterns
    };
  }, [chapters, totalWorldElements, totalCharacters]);

  return analytics;
};
