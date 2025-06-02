
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';

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

export interface WritingVelocityData {
  date: string;
  words: number;
  chapters: number;
}

export interface HeatmapData {
  date: string;
  count: number;
  level: number;
}

export interface ContentBreakdown {
  name: string;
  value: number;
  color: string;
}

export const calculateWritingVelocity = (chapters: Chapter[], days: number = 30): WritingVelocityData[] => {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
  
  return dateInterval.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayChapters = chapters.filter(chapter => {
      const chapterDate = format(parseISO(chapter.created_at), 'yyyy-MM-dd');
      return chapterDate === dateStr;
    });
    
    const wordsWritten = dayChapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
    
    return {
      date: dateStr,
      words: wordsWritten,
      chapters: dayChapters.length
    };
  });
};

export const generateHeatmapData = (chapters: Chapter[], worldElements: number): HeatmapData[] => {
  const endDate = new Date();
  const startDate = subDays(endDate, 364); // Full year
  const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
  
  return dateInterval.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayActivity = chapters.filter(chapter => {
      const chapterDate = format(parseISO(chapter.created_at), 'yyyy-MM-dd');
      const updateDate = format(parseISO(chapter.updated_at), 'yyyy-MM-dd');
      return chapterDate === dateStr || updateDate === dateStr;
    });
    
    const activityCount = dayActivity.length;
    const level = activityCount === 0 ? 0 : activityCount >= 3 ? 4 : activityCount >= 2 ? 3 : activityCount >= 1 ? 2 : 1;
    
    return {
      date: dateStr,
      count: activityCount,
      level
    };
  });
};

export const calculateContentBreakdown = (chapters: Chapter[], worldElementsByType: WorldbuildingElementsByType): ContentBreakdown[] => {
  const totalWords = chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
  
  const result: ContentBreakdown[] = [
    {
      name: 'Written Content',
      value: totalWords,
      color: '#8B5CF6'
    }
  ];

  // Define colors for different worldbuilding element types
  const typeColors: { [key: string]: string } = {
    'Characters': '#10B981',
    'Locations': '#06B6D4',
    'Organizations': '#F59E0B',
    'Lore': '#EF4444',
    'Items': '#8B5CF6',
    'Events': '#EC4899',
    'Cultures': '#84CC16',
    'Magic Systems': '#6366F1'
  };

  // Add worldbuilding elements by type
  Object.entries(worldElementsByType).forEach(([type, count], index) => {
    result.push({
      name: type,
      value: count,
      color: typeColors[type] || `hsl(${(index * 45) % 360}, 70%, 50%)`
    });
  });

  return result;
};

export const analyzeWritingPatterns = (chapters: Chapter[]) => {
  const totalWords = chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
  const avgWordsPerChapter = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0;
  
  const publishedChapters = chapters.filter(c => c.status === 'published').length;
  const draftChapters = chapters.filter(c => c.status === 'draft').length;
  
  // Calculate most productive day (simplified)
  const dayActivity = chapters.reduce((acc, chapter) => {
    const dayOfWeek = format(parseISO(chapter.created_at), 'EEEE');
    acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostProductiveDay = Object.entries(dayActivity).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Monday';
  
  return {
    totalWords,
    avgWordsPerChapter,
    publishedChapters,
    draftChapters,
    mostProductiveDay,
    totalChapters: chapters.length
  };
};
