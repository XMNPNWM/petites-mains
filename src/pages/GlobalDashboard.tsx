
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
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for authentication to complete
    if (authLoading) {
      return;
    }

    // If no user after auth loading completes, redirect to auth
    if (!user) {
      console.log('No user found, redirecting to auth page');
      navigate('/auth', { replace: true });
      return;
    }

    // User is authenticated, fetch projects
    fetchProjects();
  }, [user, authLoading, navigate]);

  const fetchProjects = async () => {
    if (!user) {
      console.log('No user available for fetching projects');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching projects for user:', user.id);
      setError(null);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      console.log('Projects fetched successfully:', data?.length || 0);
      setProjects(data || []);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewProject = async () => {
    if (!user) {
      console.log('No user available for creating project');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title: 'New Project',
          description: 'A new writing project',
          content: '',
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        navigate(`/project/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project. Please try again.');
    }
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  const retryFetch = () => {
    setIsLoading(true);
    setError(null);
    fetchProjects();
  };

  // Show loading while auth is loading or while fetching projects
  if (authLoading || (isLoading && user)) {
    return <LoadingState />;
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={retryFetch} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // If we reach here, user is authenticated and projects are loaded
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
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onProjectUpdate={handleProjectUpdate}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GlobalDashboard;
