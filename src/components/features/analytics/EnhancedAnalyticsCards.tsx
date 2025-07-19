
import React from 'react';
import { TrendingUp, TrendingDown, Target, Zap, Clock, BookOpen, Award, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EnhancedAnalyticsData } from '@/lib/enhancedAnalyticsUtils';

interface EnhancedAnalyticsCardsProps {
  analytics: EnhancedAnalyticsData;
  totalWords: number;
  totalChapters: number;
}

const EnhancedAnalyticsCards = ({ analytics, totalWords, totalChapters }: EnhancedAnalyticsCardsProps) => {
  const cards = [
    {
      title: 'Current Streak',
      value: `${analytics.currentStreak} days`,
      subtitle: `Longest: ${analytics.longestStreak} days`,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Productivity Score',
      value: `${analytics.productivityScore}/100`,
      subtitle: 'Based on consistency & output',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Completion Rate',
      value: `${analytics.chapterCompletionRate}%`,
      subtitle: 'Chapters published',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Weekly Progress',
      value: analytics.weeklyTrends.thisWeek.toLocaleString(),
      subtitle: analytics.weeklyTrends.weekChange >= 0 
        ? `+${analytics.weeklyTrends.weekChange}% from last week`
        : `${analytics.weeklyTrends.weekChange}% from last week`,
      icon: analytics.weeklyTrends.weekChange >= 0 ? TrendingUp : TrendingDown,
      color: analytics.weeklyTrends.weekChange >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: analytics.weeklyTrends.weekChange >= 0 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Avg Words/Session',
      value: analytics.avgWordsPerSession.toLocaleString(),
      subtitle: `Avg chapter: ${analytics.avgChapterLength} words`,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Projected Completion',
      value: analytics.estimatedCompletionDays > 0 
        ? `${analytics.estimatedCompletionDays} days`
        : 'On track!',
      subtitle: `Target: ${analytics.recommendedDailyTarget} words/day`,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                <p className="text-sm text-slate-500 mt-1">{card.subtitle}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EnhancedAnalyticsCards;
