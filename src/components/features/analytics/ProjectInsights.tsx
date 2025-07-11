
import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, TrendingUp, Zap, Clock } from 'lucide-react';

interface ProjectInsightsProps {
  patterns: {
    totalWords: number;
    avgWordsPerChapter: number;
    publishedChapters: number;
    draftChapters: number;
    mostProductiveDay: string;
    mostProductiveHour: string;
    totalChapters: number;
    writingSessions: number;
    writingIntensity: {
      words: number;
      minutes: number;
    };
  };
}

const ProjectInsights = ({ patterns }: ProjectInsightsProps) => {
  const insights = [
    {
      icon: TrendingUp,
      title: 'Average Chapter Length',
      value: `${patterns.avgWordsPerChapter.toLocaleString()} words`,
      description: 'Consistency in your writing',
      color: 'text-purple-600'
    },
    {
      icon: Calendar,
      title: 'Most Productive Time',
      value: `${patterns.mostProductiveDay} at ${patterns.mostProductiveHour}`,
      description: 'When creativity flows best',
      color: 'text-blue-600'
    },
    {
      icon: Zap,
      title: 'Writing Intensity Record',
      value: patterns.writingIntensity.words > 0 
        ? `${patterns.writingIntensity.words} words/${patterns.writingIntensity.minutes} min`
        : 'No data yet',
      description: 'Estimated peak continuous writing',
      color: 'text-orange-600'
    },
    {
      icon: Clock,
      title: 'Active Writing Days',
      value: patterns.writingSessions.toString(),
      description: 'Days with writing activity',
      color: 'text-amber-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {insights.map((insight, index) => {
        const IconComponent = insight.icon;
        return (
          <Card key={index} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-slate-100 ${insight.color}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 text-sm">{insight.title}</h4>
                <p className="text-lg font-bold text-slate-900 mt-1">{insight.value}</p>
                <p className="text-xs text-slate-500 mt-1">{insight.description}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ProjectInsights;
