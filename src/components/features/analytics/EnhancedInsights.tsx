
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, Clock, Lightbulb, Calendar, Award } from 'lucide-react';
import { EnhancedAnalyticsData } from '@/lib/enhancedAnalyticsUtils';

interface EnhancedInsightsProps {
  analytics: EnhancedAnalyticsData;
}

const EnhancedInsights = ({ analytics }: EnhancedInsightsProps) => {
  const generateInsights = () => {
    const insights = [];

    // Streak insights
    if (analytics.currentStreak >= 7) {
      insights.push({
        icon: Award,
        type: 'achievement',
        title: 'Great Consistency!',
        message: `You're on a ${analytics.currentStreak}-day writing streak. Keep it up!`,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    } else if (analytics.currentStreak === 0) {
      insights.push({
        icon: Target,
        type: 'suggestion',
        title: 'Get Back on Track',
        message: 'Start a new writing streak today. Even 100 words counts!',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      });
    }

    // Productivity insights
    if (analytics.productivityScore >= 80) {
      insights.push({
        icon: TrendingUp,
        type: 'achievement',
        title: 'High Productivity',
        message: `Your productivity score of ${analytics.productivityScore} is excellent!`,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      });
    } else if (analytics.productivityScore < 40) {
      insights.push({
        icon: Lightbulb,
        type: 'suggestion',
        title: 'Room for Improvement',
        message: 'Try setting smaller daily goals to build momentum.',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      });
    }

    // Weekly trend insights
    if (analytics.weeklyTrends.weekChange > 20) {
      insights.push({
        icon: TrendingUp,
        type: 'achievement',
        title: 'Strong Week!',
        message: `You wrote ${analytics.weeklyTrends.weekChange}% more than last week.`,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    } else if (analytics.weeklyTrends.weekChange < -20) {
      insights.push({
        icon: Target,
        type: 'suggestion',
        title: 'Weekly Dip',
        message: 'Consider setting a specific time each day for writing.',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      });
    }

    // Time pattern insights
    const bestHour = analytics.timeOfDayData.reduce((prev, current) => 
      prev.words > current.words ? prev : current
    );
    if (bestHour.words > 0) {
      insights.push({
        icon: Clock,
        type: 'insight',
        title: 'Peak Writing Time',
        message: `You're most productive at ${bestHour.hour}:00. Schedule important writing then.`,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50'
      });
    }

    // Completion insights
    if (analytics.chapterCompletionRate >= 80) {
      insights.push({
        icon: Award,
        type: 'achievement',
        title: 'Great Finisher',
        message: `${analytics.chapterCompletionRate}% completion rate shows you finish what you start!`,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    }

    // Predictive insights
    if (analytics.estimatedCompletionDays > 0 && analytics.estimatedCompletionDays <= 30) {
      insights.push({
        icon: Calendar,
        type: 'insight',
        title: 'Goal Within Reach',
        message: `At your current pace, you'll reach your goal in ${analytics.estimatedCompletionDays} days!`,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      });
    }

    return insights.slice(0, 6); // Limit to 6 insights
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-8">
            Start writing to see personalized insights and recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Insights</CardTitle>
        <p className="text-sm text-slate-600">Personalized recommendations based on your writing patterns</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${insight.bgColor} border-opacity-20`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${insight.bgColor}`}>
                  <insight.icon className={`w-4 h-4 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium text-sm ${insight.color}`}>
                    {insight.title}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedInsights;
