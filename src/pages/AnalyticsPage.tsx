
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, BookOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  totalProjects: number;
  totalWords: number;
  totalChapters: number;
  averageWordsPerProject: number;
  projectsThisMonth: number;
  wordsThisMonth: number;
}

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProjects: 0,
    totalWords: 0,
    totalChapters: 0,
    averageWordsPerProject: 0,
    projectsThisMonth: 0,
    wordsThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id);

      if (projectsError) throw projectsError;

      // Fetch chapters for word count
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('word_count, created_at, project_id')
        .in('project_id', projects?.map(p => p.id) || []);

      if (chaptersError) throw chaptersError;

      // Calculate analytics
      const totalProjects = projects?.length || 0;
      const totalChapters = chapters?.length || 0;
      const totalWords = chapters?.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0) || 0;
      const averageWordsPerProject = totalProjects > 0 ? Math.round(totalWords / totalProjects) : 0;

      // Calculate this month's data
      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const projectsThisMonth = projects?.filter(project => 
        new Date(project.created_at) >= thisMonth
      ).length || 0;

      const chaptersThisMonth = chapters?.filter(chapter => 
        new Date(chapter.created_at) >= thisMonth
      ) || [];
      
      const wordsThisMonth = chaptersThisMonth.reduce((sum, chapter) => 
        sum + (chapter.word_count || 0), 0
      );

      setAnalytics({
        totalProjects,
        totalWords,
        totalChapters,
        averageWordsPerProject,
        projectsThisMonth,
        wordsThisMonth,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Writing Analytics</h1>
              <p className="text-slate-600">Track your writing progress and achievements</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics.projectsThisMonth} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(analytics.totalWords)}</div>
                  <p className="text-xs text-muted-foreground">
                    +{formatNumber(analytics.wordsThisMonth)} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalChapters}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all projects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Words/Project</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(analytics.averageWordsPerProject)}</div>
                  <p className="text-xs text-muted-foreground">
                    Per project average
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Writing Goals Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Writing Goals</CardTitle>
                  <CardDescription>
                    Set and track your writing objectives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-medium mb-2">Daily Word Goal</h4>
                      <p className="text-sm text-slate-600">
                        Feature coming soon! Set daily writing targets and track your progress.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-medium mb-2">Monthly Target</h4>
                      <p className="text-sm text-slate-600">
                        Feature coming soon! Plan your monthly writing objectives.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your recent writing achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.totalProjects === 0 ? (
                      <p className="text-sm text-slate-600 text-center py-8">
                        Start writing your first project to see activity here!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">
                            {analytics.totalProjects} projects created
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">
                            {formatNumber(analytics.totalWords)} words written
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm">
                            {analytics.totalChapters} chapters completed
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
