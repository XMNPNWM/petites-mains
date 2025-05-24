
import React from 'react';
import { TrendingUp, Target, Clock, BookOpen, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const WritingStats = () => {
  const weeklyData = [
    { day: 'Mon', words: 850 },
    { day: 'Tue', words: 1200 },
    { day: 'Wed', words: 750 },
    { day: 'Thu', words: 1500 },
    { day: 'Fri', words: 900 },
    { day: 'Sat', words: 1800 },
    { day: 'Sun', words: 1100 }
  ];

  const monthlyData = [
    { month: 'Jan', words: 15000 },
    { month: 'Feb', words: 18000 },
    { month: 'Mar', words: 22000 },
    { month: 'Apr', words: 16000 },
    { month: 'May', words: 25000 },
    { month: 'Jun', words: 20000 }
  ];

  const stats = [
    {
      title: 'Words Today',
      value: '1,250',
      target: '1,500',
      icon: BookOpen,
      color: 'text-blue-600',
      progress: 83
    },
    {
      title: 'Writing Streak',
      value: '12 days',
      target: '30 days',
      icon: TrendingUp,
      color: 'text-green-600',
      progress: 40
    },
    {
      title: 'Time Spent',
      value: '2h 15m',
      target: '3h',
      icon: Clock,
      color: 'text-purple-600',
      progress: 75
    },
    {
      title: 'Monthly Goal',
      value: '18,450',
      target: '25,000',
      icon: Target,
      color: 'text-amber-600',
      progress: 74
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Writing Analytics</h1>
        <p className="text-slate-600">Track your progress and achieve your writing goals</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">Goal: {stat.target}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="mt-4">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stat.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-1">{stat.progress}% of goal</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              This Week's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="words" fill="url(#gradient)" />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="words" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-green-800">First 10K Words</h3>
                <p className="text-sm text-green-600">Completed 3 days ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Week Streak</h3>
                <p className="text-sm text-blue-600">7 days in a row</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-purple-800">3 Hour Session</h3>
                <p className="text-sm text-purple-600">Personal best!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WritingStats;
