
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/features/dashboard/DashboardHeader';
import ProjectCard from '@/components/features/dashboard/ProjectCard';
import EmptyProjectsState from '@/components/features/dashboard/EmptyProjectsState';
import LoadingState from '@/components/features/dashboard/LoadingState';

interface Project {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  content: string;
}

const GlobalDashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title: 'New Project',
          description: 'A new writing project',
          content: '',
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        navigate(`/project/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <EmptyProjectsState onCreateProject={createNewProject} />
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Your Projects</h2>
              <Button 
                onClick={createNewProject} 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GlobalDashboard;
