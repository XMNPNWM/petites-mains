import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { getTextPreview } from '@/lib/contentUtils';
import { supabase } from '@/integrations/supabase/client';
import InlineEditableText from '@/components/ui/inline-editable-text';

interface Project {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  content: string;
}

interface ProjectCardProps {
  project: Project;
  onProjectUpdate?: (updatedProject: Project) => void;
}

const ProjectCard = ({ project, onProjectUpdate }: ProjectCardProps) => {
  const navigate = useNavigate();
  const [lastChapterContent, setLastChapterContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    fetchLastChapterContent();
  }, [project.id]);

  const fetchLastChapterContent = async () => {
    try {
      setIsLoadingContent(true);
      
      // Get the most recent chapter with actual content
      const { data, error } = await supabase
        .from('chapters')
        .select('content, updated_at')
        .eq('project_id', project.id)
        .not('content', 'is', null)
        .neq('content', '')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching latest chapter:', error);
        setLastChapterContent('');
        return;
      }

      setLastChapterContent(data?.content || '');
    } catch (error) {
      console.error('Error in fetchLastChapterContent:', error);
      setLastChapterContent('');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const getLastContent = (content: string) => {
    if (isLoadingContent) return 'Loading...';
    if (!content) return 'No content written yet...';
    
    // Get preview from the end of the content to show last written text
    const cleanText = getTextPreview(content, 150, true);
    if (!cleanText.trim()) return 'No content written yet...';
    
    return cleanText;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const updateProjectDescription = async (newDescription: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ description: newDescription })
        .eq('id', project.id);

      if (error) throw error;
      
      const updatedProject = { ...project, description: newDescription };
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject);
      }
    } catch (error) {
      console.error('Error updating project description:', error);
      throw error;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the editable description
    if ((e.target as HTMLElement).closest('.inline-editable')) {
      e.stopPropagation();
      return;
    }
    navigate(`/project/${project.id}`);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-1">
          {project.title}
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm text-slate-500">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(project.created_at)}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {formatDate(project.updated_at)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="inline-editable mb-4">
          <InlineEditableText
            value={project.description}
            onSave={updateProjectDescription}
            placeholder="Add a project description..."
            maxLength={200}
            className="text-slate-600 text-sm"
          />
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Last written:</p>
          <p className="text-sm text-slate-700 italic line-clamp-2">
            "{getLastContent(lastChapterContent)}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
