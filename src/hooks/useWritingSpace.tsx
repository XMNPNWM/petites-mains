
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getWordCount } from '@/lib/contentUtils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchChapters();
      if (chapterId) {
        fetchChapter(chapterId);
      }
    }
  }, [projectId, chapterId]);

  // Auto-save effect
  useEffect(() => {
    if (!currentChapter || isSaving) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 30000); // 30 seconds

    // Cleanup on unmount or chapter change
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentChapter?.content, isSaving]);

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

  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
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

  const autoSave = async () => {
    if (!currentChapter || isSaving) return;
    
    try {
      const wordCount = getWordCount(currentChapter.content);
      
      const { error } = await supabase
        .from('chapters')
        .update({ 
          content: currentChapter.content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentChapter.id);

      if (error) throw error;
      setLastSaved(new Date());
      console.log('Chapter auto-saved successfully');
    } catch (error) {
      console.error('Error auto-saving chapter:', error);
    }
  };

  const handleSave = async () => {
    if (!currentChapter || isSaving) return;
    
    setIsSaving(true);
    
    try {
      const wordCount = getWordCount(currentChapter.content);
      
      const { error } = await supabase
        .from('chapters')
        .update({ 
          content: currentChapter.content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentChapter.id);

      if (error) throw error;
      
      setLastSaved(new Date());
      toast({
        title: "Chapter saved",
        description: "Your changes have been saved successfully.",
      });
      console.log('Chapter saved successfully');
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast({
        title: "Save failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
    chapters,
    isSaving,
    lastSaved,
    handleChapterSelect,
    handleSave,
    handleContentChange,
    handleBackClick
  };
};
