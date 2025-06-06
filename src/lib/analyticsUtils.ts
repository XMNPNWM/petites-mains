
import { format, subDays, eachDayOfInterval, parseISO, isSameDay, getHours } from 'date-fns';

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
  cumulativeWords: number;
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
  
  let cumulativeWords = 0;
  
  return dateInterval.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Count new chapters created on this day
    const newChapters = chapters.filter(chapter => {
      const chapterDate = format(parseISO(chapter.created_at), 'yyyy-MM-dd');
      return chapterDate === dateStr;
    });
    
    // Count chapters updated on this day (but not created)
    const updatedChapters = chapters.filter(chapter => {
      const updateDate = format(parseISO(chapter.updated_at), 'yyyy-MM-dd');
      const createDate = format(parseISO(chapter.created_at), 'yyyy-MM-dd');
      return updateDate === dateStr && createDate !== dateStr;
    });
    
    // Calculate words from new chapters
    const wordsFromNewChapters = newChapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
    
    // For updated chapters, estimate word changes (simplified approach)
    const wordsFromUpdates = updatedChapters.reduce((sum, chapter) => {
      // Estimate that updates add approximately 10% of current word count per update
      return sum + Math.floor((chapter.word_count || 0) * 0.1);
    }, 0);
    
    const dailyWords = wordsFromNewChapters + wordsFromUpdates;
    cumulativeWords += dailyWords;
    
    return {
      date: dateStr,
      words: dailyWords,
      chapters: newChapters.length,
      cumulativeWords
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
  const result: ContentBreakdown[] = [];

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

  // Add worldbuilding elements by type only
  Object.entries(worldElementsByType).forEach(([type, count], index) => {
    if (count > 0) {
      result.push({
        name: type,
        value: count,
        color: typeColors[type] || `hsl(${(index * 45) % 360}, 70%, 50%)`
      });
    }
  });

  return result;
};

export const analyzeWritingPatterns = (chapters: Chapter[]) => {
  const totalWords = chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
  const avgWordsPerChapter = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0;
  
  const publishedChapters = chapters.filter(c => c.status === 'published').length;
  const draftChapters = chapters.filter(c => c.status === 'draft').length;
  
  // Calculate most productive day
  const dayActivity = chapters.reduce((acc, chapter) => {
    const dayOfWeek = format(parseISO(chapter.created_at), 'EEEE');
    acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostProductiveDay = Object.entries(dayActivity).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Monday';
  
  // Calculate most productive hour
  const hourActivity = chapters.reduce((acc, chapter) => {
    const hour = getHours(parseISO(chapter.created_at));
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const mostProductiveHour = Object.entries(hourActivity)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '9';
  
  const mostProductiveHourFormatted = `${mostProductiveHour}:00`;
  
  // Calculate writing sessions (number of distinct days with activity)
  const writingDays = new Set(chapters.map(chapter => 
    format(parseISO(chapter.created_at), 'yyyy-MM-dd')
  ));
  
  return {
    totalWords,
    avgWordsPerChapter,
    publishedChapters,
    draftChapters,
    mostProductiveDay,
    mostProductiveHour: mostProductiveHourFormatted,
    totalChapters: chapters.length,
    writingSessions: writingDays.size
  };
};
