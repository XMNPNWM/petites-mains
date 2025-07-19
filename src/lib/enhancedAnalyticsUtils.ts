
import { format, subDays, eachDayOfInterval, parseISO, differenceInDays, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

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

export interface EnhancedAnalyticsData {
  // Advanced Metrics
  currentStreak: number;
  longestStreak: number;
  productivityScore: number;
  chapterCompletionRate: number;
  avgWordsPerSession: number;
  avgChapterLength: number;
  
  // Trend Analysis
  weeklyTrends: {
    thisWeek: number;
    lastWeek: number;
    weekChange: number;
  };
  monthlyTrends: {
    thisMonth: number;
    lastMonth: number;
    monthChange: number;
  };
  
  // Writing Patterns
  timeOfDayData: Array<{ hour: number; words: number; sessions: number }>;
  dayOfWeekData: Array<{ day: string; words: number; sessions: number }>;
  
  // Distribution Analysis
  wordCountDistribution: Array<{ range: string; count: number }>;
  statusProgression: Array<{ status: string; count: number; percentage: number }>;
  
  // Predictive Analytics
  estimatedCompletionDays: number;
  recommendedDailyTarget: number;
  projectedMonthlyWords: number;
}

export const calculateEnhancedAnalytics = (
  chapters: Chapter[], 
  totalWorldElements: number, 
  worldElementsByType: WorldbuildingElementsByType
): EnhancedAnalyticsData => {
  // Calculate writing streaks
  const streaks = calculateWritingStreaks(chapters);
  
  // Calculate productivity score (0-100)
  const productivityScore = calculateProductivityScore(chapters);
  
  // Calculate completion rates
  const completionRate = calculateChapterCompletionRate(chapters);
  
  // Calculate trends
  const weeklyTrends = calculateWeeklyTrends(chapters);
  const monthlyTrends = calculateMonthlyTrends(chapters);
  
  // Analyze writing patterns
  const timePatterns = analyzeTimePatterns(chapters);
  const dayPatterns = analyzeDayPatterns(chapters);
  
  // Calculate distributions
  const wordDistribution = calculateWordCountDistribution(chapters);
  const statusProgression = calculateStatusProgression(chapters);
  
  // Predictive analytics
  const predictions = calculatePredictiveMetrics(chapters);
  
  return {
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    productivityScore,
    chapterCompletionRate: completionRate,
    avgWordsPerSession: calculateAvgWordsPerSession(chapters),
    avgChapterLength: calculateAvgChapterLength(chapters),
    weeklyTrends,
    monthlyTrends,
    timeOfDayData: timePatterns,
    dayOfWeekData: dayPatterns,
    wordCountDistribution: wordDistribution,
    statusProgression,
    estimatedCompletionDays: predictions.estimatedDays,
    recommendedDailyTarget: predictions.dailyTarget,
    projectedMonthlyWords: predictions.monthlyProjection
  };
};

const calculateWritingStreaks = (chapters: Chapter[]) => {
  const writingDays = chapters
    .map(chapter => format(parseISO(chapter.created_at), 'yyyy-MM-dd'))
    .sort()
    .filter((date, index, arr) => arr.indexOf(date) === index);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  
  // Check if user wrote today or yesterday for current streak
  if (writingDays.includes(today)) {
    currentStreak = 1;
    // Count backwards from today
    for (let i = 1; i < 365; i++) {
      const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (writingDays.includes(checkDate)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (writingDays.includes(yesterday)) {
    // Count backwards from yesterday
    for (let i = 1; i < 365; i++) {
      const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (writingDays.includes(checkDate)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  // Calculate longest streak
  for (let i = 0; i < writingDays.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = parseISO(writingDays[i - 1]);
      const currDate = parseISO(writingDays[i]);
      const daysDiff = differenceInDays(currDate, prevDate);
      
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return { current: currentStreak, longest: longestStreak };
};

const calculateProductivityScore = (chapters: Chapter[]): number => {
  if (chapters.length === 0) return 0;
  
  const last30Days = subDays(new Date(), 30);
  const recentChapters = chapters.filter(chapter => 
    parseISO(chapter.created_at) >= last30Days
  );
  
  // Factors: consistency, word count, completion rate
  const consistencyScore = (recentChapters.length / 30) * 40; // Max 40 points
  const wordScore = Math.min((recentChapters.reduce((sum, ch) => sum + ch.word_count, 0) / 10000) * 30, 30); // Max 30 points
  const completionScore = (recentChapters.filter(ch => ch.status === 'published').length / Math.max(recentChapters.length, 1)) * 30; // Max 30 points
  
  return Math.round(Math.min(consistencyScore + wordScore + completionScore, 100));
};

const calculateChapterCompletionRate = (chapters: Chapter[]): number => {
  if (chapters.length === 0) return 0;
  const completed = chapters.filter(ch => ch.status === 'published').length;
  return Math.round((completed / chapters.length) * 100);
};

const calculateAvgWordsPerSession = (chapters: Chapter[]): number => {
  if (chapters.length === 0) return 0;
  const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
  const uniqueDays = new Set(chapters.map(ch => format(parseISO(ch.created_at), 'yyyy-MM-dd'))).size;
  return Math.round(totalWords / Math.max(uniqueDays, 1));
};

const calculateAvgChapterLength = (chapters: Chapter[]): number => {
  if (chapters.length === 0) return 0;
  const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
  return Math.round(totalWords / chapters.length);
};

const calculateWeeklyTrends = (chapters: Chapter[]) => {
  const thisWeekStart = startOfWeek(new Date());
  const lastWeekStart = startOfWeek(subDays(new Date(), 7));
  const lastWeekEnd = endOfWeek(subDays(new Date(), 7));
  
  const thisWeek = chapters.filter(ch => parseISO(ch.created_at) >= thisWeekStart)
    .reduce((sum, ch) => sum + ch.word_count, 0);
  
  const lastWeek = chapters.filter(ch => {
    const date = parseISO(ch.created_at);
    return date >= lastWeekStart && date <= lastWeekEnd;
  }).reduce((sum, ch) => sum + ch.word_count, 0);
  
  const weekChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
  
  return { thisWeek, lastWeek, weekChange };
};

const calculateMonthlyTrends = (chapters: Chapter[]) => {
  const thisMonthStart = startOfMonth(new Date());
  const lastMonthStart = startOfMonth(subDays(new Date(), 30));
  const lastMonthEnd = endOfMonth(subDays(new Date(), 30));
  
  const thisMonth = chapters.filter(ch => parseISO(ch.created_at) >= thisMonthStart)
    .reduce((sum, ch) => sum + ch.word_count, 0);
  
  const lastMonth = chapters.filter(ch => {
    const date = parseISO(ch.created_at);
    return date >= lastMonthStart && date <= lastMonthEnd;
  }).reduce((sum, ch) => sum + ch.word_count, 0);
  
  const monthChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
  
  return { thisMonth, lastMonth, monthChange };
};

const analyzeTimePatterns = (chapters: Chapter[]) => {
  const hourData: { [key: number]: { words: number; sessions: number } } = {};
  
  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourData[i] = { words: 0, sessions: 0 };
  }
  
  chapters.forEach(chapter => {
    const hour = parseISO(chapter.created_at).getHours();
    hourData[hour].words += chapter.word_count;
    hourData[hour].sessions += 1;
  });
  
  return Object.entries(hourData).map(([hour, data]) => ({
    hour: parseInt(hour),
    words: data.words,
    sessions: data.sessions
  }));
};

const analyzeDayPatterns = (chapters: Chapter[]) => {
  const dayData: { [key: string]: { words: number; sessions: number } } = {
    'Monday': { words: 0, sessions: 0 },
    'Tuesday': { words: 0, sessions: 0 },
    'Wednesday': { words: 0, sessions: 0 },
    'Thursday': { words: 0, sessions: 0 },
    'Friday': { words: 0, sessions: 0 },
    'Saturday': { words: 0, sessions: 0 },
    'Sunday': { words: 0, sessions: 0 }
  };
  
  chapters.forEach(chapter => {
    const day = format(parseISO(chapter.created_at), 'EEEE');
    if (dayData[day]) {
      dayData[day].words += chapter.word_count;
      dayData[day].sessions += 1;
    }
  });
  
  return Object.entries(dayData).map(([day, data]) => ({
    day,
    words: data.words,
    sessions: data.sessions
  }));
};

const calculateWordCountDistribution = (chapters: Chapter[]) => {
  const ranges = [
    { range: '0-500', min: 0, max: 500 },
    { range: '501-1000', min: 501, max: 1000 },
    { range: '1001-2000', min: 1001, max: 2000 },
    { range: '2001-3000', min: 2001, max: 3000 },
    { range: '3000+', min: 3001, max: Infinity }
  ];
  
  return ranges.map(range => ({
    range: range.range,
    count: chapters.filter(ch => ch.word_count >= range.min && ch.word_count <= range.max).length
  }));
};

const calculateStatusProgression = (chapters: Chapter[]) => {
  const statusCounts = chapters.reduce((acc, ch) => {
    acc[ch.status] = (acc[ch.status] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  const total = chapters.length;
  
  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    percentage: Math.round((count / total) * 100)
  }));
};

const calculatePredictiveMetrics = (chapters: Chapter[]) => {
  const last30Days = chapters.filter(ch => 
    parseISO(ch.created_at) >= subDays(new Date(), 30)
  );
  
  const avgDailyWords = last30Days.reduce((sum, ch) => sum + ch.word_count, 0) / 30;
  const targetWords = 50000; // Assume novel target
  const currentWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
  const remainingWords = Math.max(targetWords - currentWords, 0);
  
  const estimatedDays = avgDailyWords > 0 ? Math.ceil(remainingWords / avgDailyWords) : 0;
  const dailyTarget = Math.ceil(remainingWords / 30); // 30-day target
  const monthlyProjection = Math.round(avgDailyWords * 30);
  
  return {
    estimatedDays,
    dailyTarget,
    monthlyProjection
  };
};
