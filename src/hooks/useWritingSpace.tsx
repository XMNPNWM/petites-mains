
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  title: string;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
}

export const useWritingSpace = () => {
  const { projectId, chapterId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      if (chapterId) {
        fetchChapter(chapterId);
      }
    }
  }, [projectId, chapterId]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchChapter = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCurrentChapter(data);
    } catch (error) {
      console.error('Error fetching chapter:', error);
    }
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    navigate(`/project/${projectId}/write/${chapter.id}`);
  };

  const handleSave = async () => {
    if (!currentChapter) return;
    
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ 
          content: currentChapter.content,
          word_count: currentChapter.content.split(' ').filter(word => word.length > 0).length,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentChapter.id);

      if (error) throw error;
      console.log('Chapter saved successfully');
    } catch (error) {
      console.error('Error saving chapter:', error);
    }
  };

  const handleContentChange = (content: string) => {
    setCurrentChapter(prev => prev ? {...prev, content} : null);
  };

  const handleBackClick = () => {
    navigate(`/project/${projectId}`);
  };

  return {
    projectId,
    project,
    currentChapter,
    handleChapterSelect,
    handleSave,
    handleContentChange,
    handleBackClick
  };
};
