
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react';
import { WritingVelocityData } from '@/lib/analyticsUtils';

interface VelocityInsightsProps {
  data: WritingVelocityData[];
}

const VelocityInsights = ({ data }: VelocityInsightsProps) => {
  // Calculate insights
  const totalDays = data.length;
  const activeDays = data.filter(d => d.hasActivity).length;
  const totalWords = data.reduce((sum, d) => sum + d.dailyWords, 0);
  const avgDailyWords = activeDays > 0 ? Math.round(totalWords / activeDays) : 0;
  
  // Find longest streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Count from end to find current streak
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].hasActivity) {
      if (i === data.length - 1) currentStreak++; // Started counting
      if (currentStreak > 0 || i === data.length - 1) currentStreak++;
    } else if (currentStreak > 0) {
      break; // Streak ended
    }
  }
  
  // Find longest streak
  data.forEach(day => {
    if (day.hasActivity) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });
  
  // Trend analysis (compare first and second half)
  const midPoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midPoint);
  const secondHalf = data.slice(midPoint);
  
  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.dailyWords, 0) / midPoint;
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.dailyWords, 0) / (data.length - midPoint);
  
  const trendDirection = secondHalfAvg > firstHalfAvg ? 'up' : 'down';
  const trendPercentage = firstHalfAvg > 0 ? 
    Math.abs(Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)) : 0;

  const insights = [
    {
      title: 'Writing Consistency',
      value: `${Math.round((activeDays / totalDays) * 100)}%`,
      subtitle: `${activeDays} of ${totalDays} days active`,
      icon: Calendar,
      color: activeDays / totalDays > 0.5 ? 'text-green-600' : 'text-orange-600'
    },
    {
      title: 'Current Streak',
      value: `${currentStreak} days`,
      subtitle: `Longest: ${longestStreak} days`,
      icon: Target,
      color: currentStreak > 3 ? 'text-green-600' : 'text-slate-600'
    },
    {
      title: 'Daily Average',
      value: `${avgDailyWords} words`,
      subtitle: 'On active writing days',
      icon: TrendingUp,
      color: avgDailyWords > 500 ? 'text-green-600' : 'text-blue-600'
    },
    {
      title: 'Recent Trend',
      value: `${trendDirection === 'up' ? '+' : '-'}${trendPercentage}%`,
      subtitle: 'vs. first half of period',
      icon: trendDirection === 'up' ? TrendingUp : TrendingDown,
      color: trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {insights.map((insight, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">{insight.title}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{insight.value}</p>
                <p className="text-xs text-slate-500 mt-1">{insight.subtitle}</p>
              </div>
              <div className={`p-2 rounded-full bg-slate-50`}>
                <insight.icon className={`w-4 h-4 ${insight.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VelocityInsights;
