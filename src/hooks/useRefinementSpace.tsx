
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
  project_id: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  user_id: string;
}

interface RefinementData {
  id: string;
  chapter_id: string;
  original_content: string;
  enhanced_content: string;
  refinement_status: 'untouched' | 'in_progress' | 'completed' | 'updated';
  ai_changes: any[];
  context_summary: string;
}

// Type casting function to handle database type mismatches
const castToProject = (dbProject: any): Project => {
  return {
    id: dbProject.id,
    title: dbProject.title,
    description: dbProject.description || '',
    user_id: dbProject.user_id || ''
  };
};

const castToRefinementData = (dbRefinement: any): RefinementData => {
  const validStatuses = ['untouched', 'in_progress', 'completed', 'updated'];
  
  return {
    id: dbRefinement.id,
    chapter_id: dbRefinement.chapter_id,
    original_content: dbRefinement.original_content,
    enhanced_content: dbRefinement.enhanced_content,
    refinement_status: validStatuses.includes(dbRefinement.refinement_status) 
      ? dbRefinement.refinement_status 
      : 'untouched',
    ai_changes: dbRefinement.ai_changes || [],
    context_summary: dbRefinement.context_summary
  };
};

export const useRefinementSpace = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [refinementData, setRefinementData] = useState<RefinementData | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(castToProject(data));
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  }, [projectId]);

  const fetchChapters = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;
      setChapters(data || []);
      
      if (data && data.length > 0 && !currentChapter) {
        setCurrentChapter(data[0]);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  }, [projectId, currentChapter]);

  const fetchRefinementData = useCallback(async (chapterId: string) => {
    if (!chapterId) return;
    
    try {
      const { data, error } = await supabase
        .from('chapter_refinements')
        .select('*')
        .eq('chapter_id', chapterId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setRefinementData(castToRefinementData(data));
      } else {
        // Create initial refinement record if it doesn't exist
        const chapter = chapters.find(c => c.id === chapterId);
        if (chapter) {
          const { data: newRefinement, error: createError } = await supabase
            .from('chapter_refinements')
            .insert({
              chapter_id: chapterId,
              original_content: chapter.content || '',
              enhanced_content: chapter.content || '',
              refinement_status: 'untouched'
            })
            .select()
            .single();

          if (createError) throw createError;
          setRefinementData(castToRefinementData(newRefinement));
        }
      }
    } catch (error) {
      console.error('Error fetching refinement data:', error);
    }
  }, [chapters]);

  const handleChapterSelect = useCallback((chapter: Chapter) => {
    setCurrentChapter(chapter);
    fetchRefinementData(chapter.id);
  }, [fetchRefinementData]);

  const handleContentChange = useCallback(async (content: string) => {
    if (!refinementData) return;
    
    try {
      const { error } = await supabase
        .from('chapter_refinements')
        .update({
          enhanced_content: content,
          refinement_status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', refinementData.id);

      if (error) throw error;
      
      setRefinementData(prev => prev ? {
        ...prev,
        enhanced_content: content,
        refinement_status: 'in_progress'
      } : null);
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    }
  }, [refinementData, toast]);

  const handleChangeDecision = useCallback(async (changeId: string, decision: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('ai_change_tracking')
        .update({ user_decision: decision })
        .eq('id', changeId);

      if (error) throw error;
      
      toast({
        title: "Change Updated",
        description: `Change ${decision} successfully`,
      });
    } catch (error) {
      console.error('Error updating change decision:', error);
      toast({
        title: "Error",
        description: "Failed to update change decision",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleBackClick = useCallback(() => {
    // Navigate to Writing Space instead of project overview
    navigate(`/project/${projectId}/write`);
  }, [navigate, projectId]);

  const refreshData = useCallback(() => {
    fetchProject();
    fetchChapters();
    if (currentChapter) {
      fetchRefinementData(currentChapter.id);
    }
  }, [fetchProject, fetchChapters, fetchRefinementData, currentChapter]);

  useEffect(() => {
    fetchProject();
    fetchChapters();
  }, [fetchProject, fetchChapters]);

  useEffect(() => {
    if (currentChapter) {
      fetchRefinementData(currentChapter.id);
    }
  }, [currentChapter, fetchRefinementData]);

  return {
    project,
    chapters,
    currentChapter,
    refinementData,
    handleChapterSelect,
    handleContentChange,
    handleChangeDecision,
    handleBackClick,
    refreshData
  };
};
