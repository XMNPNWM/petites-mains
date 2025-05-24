
import React from 'react';
import { TrendingUp, BookOpen, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AnalyticsCards = () => {
  const stats = [
    {
      title: 'Words Written',
      value: '12,450',
      change: '+15%',
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      title: 'Writing Streak',
      value: '7 days',
      change: '+2 days',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Time Spent',
      value: '24h 30m',
      change: '+5h',
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      title: 'Goals Met',
      value: '85%',
      change: '+10%',
      icon: Target,
      color: 'text-amber-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-green-600">{stat.change} from last week</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnalyticsCards;
