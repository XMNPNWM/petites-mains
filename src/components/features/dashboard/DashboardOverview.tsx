
import React from 'react';
import { 
  BookOpen, 
  Users, 
  Target, 
  TrendingUp,
  Plus,
  Clock,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProjectList from './ProjectList';
import AnalyticsCards from './AnalyticsCards';

const DashboardOverview = () => {
  const recentProjects = [
    {
      id: 1,
      title: "The Dragon's Quest",
      genre: "Fantasy",
      wordCount: 45230,
      lastModified: "2 hours ago",
      progress: 65
    },
    {
      id: 2,
      title: "Cyberpunk Chronicles",
      genre: "Sci-Fi",
      wordCount: 12450,
      lastModified: "1 day ago",
      progress: 25
    },
    {
      id: 3,
      title: "Mystery of the Old Manor",
      genre: "Mystery",
      wordCount: 78900,
      lastModified: "3 days ago",
      progress: 90
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, John!</h1>
        <p className="text-purple-100 mb-4">Ready to continue your writing journey?</p>
        <div className="flex items-center space-x-4">
          <Button className="bg-white text-purple-600 hover:bg-gray-100">
            <Plus className="w-4 h-4 mr-2" />
            Start New Story
          </Button>
          <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
            <BookOpen className="w-4 h-4 mr-2" />
            Continue Writing
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <AnalyticsCards />

      {/* Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Projects
              <Button variant="ghost" size="sm">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{project.title}</h3>
                    <p className="text-sm text-slate-600">{project.genre} • {project.wordCount.toLocaleString()} words</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-600 mb-1">{project.progress}%</div>
                    <div className="w-16 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Writing Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Today's Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Daily Word Count</span>
                <span className="font-medium">750 / 1000</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{ width: '75%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Writing Time</span>
                <span className="font-medium">45 / 60 min</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-3 text-purple-600" />
            <h3 className="font-medium mb-1">Create New Project</h3>
            <p className="text-sm text-slate-600">Start a fresh writing project</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-medium mb-1">Character Builder</h3>
            <p className="text-sm text-slate-600">Design compelling characters</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-3 text-amber-600" />
            <h3 className="font-medium mb-1">Story Planner</h3>
            <p className="text-sm text-slate-600">Outline your next masterpiece</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
