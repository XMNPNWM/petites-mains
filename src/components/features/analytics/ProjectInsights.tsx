
import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, TrendingUp, Target, Clock } from 'lucide-react';

interface ProjectInsightsProps {
  patterns: {
    totalWords: number;
    avgWordsPerChapter: number;
    publishedChapters: number;
    draftChapters: number;
    mostProductiveDay: string;
    totalChapters: number;
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
      title: 'Most Productive Day',
      value: patterns.mostProductiveDay,
      description: 'When creativity flows best',
      color: 'text-blue-600'
    },
    {
      icon: Target,
      title: 'Completion Rate',
      value: patterns.totalChapters > 0 ? `${Math.round((patterns.publishedChapters / patterns.totalChapters) * 100)}%` : '0%',
      description: 'Chapters published vs drafted',
      color: 'text-green-600'
    },
    {
      icon: Clock,
      title: 'Writing Sessions',
      value: patterns.totalChapters.toString(),
      description: 'Total creative sessions',
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
