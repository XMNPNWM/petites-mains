import { format, subDays, eachDayOfInterval, parseISO, isSameDay, getHours, differenceInMinutes } from 'date-fns';

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
  dailyWords: number;
  hasActivity: boolean;
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

export interface AIBrainBreakdown {
  name: string;
  value: number;
  color: string;
}

export const calculateWritingVelocity = (chapters: Chapter[], days: number = 30): WritingVelocityData[] => {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Create a map to track word count changes by date
  const dailyWordChanges = new Map<string, number>();
  const dailyChapterCounts = new Map<string, number>();
  
  // Initialize all dates with zero
  dateInterval.forEach(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    dailyWordChanges.set(dateStr, 0);
    dailyChapterCounts.set(dateStr, 0);
  });
  
  // Track chapter creation
  chapters.forEach(chapter => {
    const createdDate = format(parseISO(chapter.created_at), 'yyyy-MM-dd');
    if (dailyWordChanges.has(createdDate)) {
      dailyWordChanges.set(createdDate, dailyWordChanges.get(createdDate)! + (chapter.word_count || 0));
      dailyChapterCounts.set(createdDate, dailyChapterCounts.get(createdDate)! + 1);
    }
  });
  
  // Track chapter updates (approximate daily word changes)
  chapters.forEach(chapter => {
    const createdDate = format(parseISO(chapter.created_at), 'yyyy-MM-dd');
    const updatedDate = format(parseISO(chapter.updated_at), 'yyyy-MM-dd');
    
    // If updated on a different day than created, distribute word count
    if (createdDate !== updatedDate && dailyWordChanges.has(updatedDate)) {
      // Estimate that updates represent additional writing
      const estimatedDailyWords = Math.floor((chapter.word_count || 0) * 0.3); // 30% of total as updates
      dailyWordChanges.set(updatedDate, dailyWordChanges.get(updatedDate)! + estimatedDailyWords);
    }
  });
  
  // Build the result with cumulative tracking
  let cumulativeWords = 0;
  
  return dateInterval.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dailyWords = dailyWordChanges.get(dateStr) || 0;
    const chaptersCreated = dailyChapterCounts.get(dateStr) || 0;
    
    cumulativeWords += dailyWords;
    
    return {
      date: dateStr,
      words: dailyWords, // This now represents actual daily progress
      chapters: chaptersCreated,
      cumulativeWords,
      dailyWords,
      hasActivity: dailyWords > 0 || chaptersCreated > 0
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

export const calculateAIBrainBreakdown = (
  knowledge: any[],
  chapterSummaries: any[],
  plotPoints: any[],
  plotThreads: any[],
  timelineEvents: any[],
  characterRelationships: any[],
  worldBuilding: any[],
  themes: any[]
): AIBrainBreakdown[] => {
  const result: AIBrainBreakdown[] = [];

  // Define colors for AI brain categories (matching tab functionality)
  const categoryColors = {
    'Characters': '#3B82F6',      // Blue
    'Relations': '#EF4444',       // Red
    'Plot Points': '#10B981',     // Green
    'Threads': '#8B5CF6',         // Purple
    'Timeline': '#F59E0B',        // Orange
    'World': '#06B6D4',           // Cyan
    'Summaries': '#6366F1',       // Indigo
    'Themes': '#EC4899'           // Pink
  };

  // Count characters (from knowledge where category = 'character')
  const charactersCount = knowledge.filter(item => item.category === 'character').length;
  if (charactersCount > 0) {
    result.push({
      name: 'Characters',
      value: charactersCount,
      color: categoryColors['Characters']
    });
  }

  // Count character relationships
  if (characterRelationships.length > 0) {
    result.push({
      name: 'Relations',
      value: characterRelationships.length,
      color: categoryColors['Relations']
    });
  }

  // Count plot points
  if (plotPoints.length > 0) {
    result.push({
      name: 'Plot Points',
      value: plotPoints.length,
      color: categoryColors['Plot Points']
    });
  }

  // Count plot threads
  if (plotThreads.length > 0) {
    result.push({
      name: 'Threads',
      value: plotThreads.length,
      color: categoryColors['Threads']
    });
  }

  // Count timeline events
  if (timelineEvents.length > 0) {
    result.push({
      name: 'Timeline',
      value: timelineEvents.length,
      color: categoryColors['Timeline']
    });
  }

  // Count world building elements
  if (worldBuilding.length > 0) {
    result.push({
      name: 'World',
      value: worldBuilding.length,
      color: categoryColors['World']
    });
  }

  // Count chapter summaries
  if (chapterSummaries.length > 0) {
    result.push({
      name: 'Summaries',
      value: chapterSummaries.length,
      color: categoryColors['Summaries']
    });
  }

  // Count themes
  if (themes.length > 0) {
    result.push({
      name: 'Themes',
      value: themes.length,
      color: categoryColors['Themes']
    });
  }

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
  
  // Calculate estimated writing intensity based on available data
  const calculateWritingIntensity = () => {
    if (chapters.length === 0) return { words: 0, minutes: 0 };
    
    // Find the chapter with highest word count to estimate peak performance
    const maxWordChapter = chapters.reduce((max, chapter) => 
      (chapter.word_count || 0) > (max.word_count || 0) ? chapter : max
    );
    
    const maxWords = maxWordChapter.word_count || 0;
    
    // Estimate continuous writing time based on word count patterns
    // Assume average writing speed and factor in chapter complexity
    const estimatedMinutes = maxWords < 500 ? Math.max(15, maxWords / 40) : // 40 words/min for shorter pieces
                            maxWords < 1500 ? Math.max(30, maxWords / 35) : // 35 words/min for medium pieces  
                            Math.max(60, maxWords / 30); // 30 words/min for longer pieces
    
    return {
      words: Math.floor(maxWords * 0.6), // Estimate continuous portion (60% of total)
      minutes: Math.floor(estimatedMinutes * 0.6)
    };
  };
  
  const writingIntensity = calculateWritingIntensity();
  
  return {
    totalWords,
    avgWordsPerChapter,
    publishedChapters,
    draftChapters,
    mostProductiveDay,
    mostProductiveHour: mostProductiveHourFormatted,
    totalChapters: chapters.length,
    writingSessions: writingDays.size,
    writingIntensity
  };
};
