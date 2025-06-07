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
  
  // Calculate total words at the end of each day
  const dailyTotals: Record<string, number> = {};
  
  // Initialize with 0 for all days
  dateInterval.forEach(date => {
    dailyTotals[format(date, 'yyyy-MM-dd')] = 0;
  });
  
  // Calculate cumulative word count for each day
  chapters.forEach(chapter => {
    const chapterDate = format(parseISO(chapter.created_at), 'yyyy-MM-dd');
    const chapterUpdatedDate = format(parseISO(chapter.updated_at), 'yyyy-MM-dd');
    
    // Add word count to the day the chapter was created or last updated
    const relevantDate = chapterUpdatedDate >= chapterDate ? chapterUpdatedDate : chapterDate;
    
    if (dailyTotals.hasOwnProperty(relevantDate)) {
      dailyTotals[relevantDate] += chapter.word_count || 0;
    }
  });
  
  // Convert to cumulative and calculate daily differences
  let previousCumulative = 0;
  
  return dateInterval.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Count new chapters created on this day
    const newChaptersCount = chapters.filter(chapter => {
      const chapterDate = format(parseISO(chapter.created_at), 'yyyy-MM-dd');
      return chapterDate === dateStr;
    }).length;
    
    // Calculate current day's total words from all chapters up to this date
    const currentDayTotal = chapters
      .filter(chapter => {
        const chapterDate = format(parseISO(chapter.updated_at), 'yyyy-MM-dd');
        return chapterDate <= dateStr;
      })
      .reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
    
    // Daily words written = difference from previous day
    const dailyWords = currentDayTotal - previousCumulative;
    
    previousCumulative = currentDayTotal;
    
    return {
      date: dateStr,
      words: Math.max(0, dailyWords), // Ensure no negative values
      chapters: newChaptersCount,
      cumulativeWords: currentDayTotal
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
