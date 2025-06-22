import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProjectData } from './useProjectData';
import { RefinementService } from '@/services/RefinementService';
import { Chapter, RefinementData } from '@/types/shared';

export const useRefinementSpace = (projectId: string | undefined) => {
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [refinementData, setRefinementData] = useState<RefinementData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { project, chapters } = useProjectData(projectId);

  const fetchRefinementData = useCallback(async (chapterId: string) => {
    if (!chapterId) return;
    
    try {
      let data = await RefinementService.fetchRefinementData(chapterId);
      
      if (!data) {
        const chapter = chapters.find(c => c.id === chapterId);
        if (chapter) {
          data = await RefinementService.createRefinementData(chapterId, chapter.content || '');
        }
      }
      
      setRefinementData(data);
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
      await RefinementService.updateRefinementContent(refinementData.id, content);
      
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

  const handleSave = useCallback(async () => {
    if (!refinementData || isSaving) return;
    
    setIsSaving(true);
    try {
      await RefinementService.updateRefinementContent(refinementData.id, refinementData.enhanced_content);
      setLastSaved(new Date());
      
      toast({
        title: "Saved",
        description: "Enhanced content saved successfully",
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [refinementData, isSaving, toast]);

  const handleBackClick = useCallback(() => {
    navigate(`/project/${projectId}/write`);
  }, [navigate, projectId]);

  const refreshData = useCallback(() => {
    if (currentChapter) {
      fetchRefinementData(currentChapter.id);
    }
  }, [fetchRefinementData, currentChapter]);

  useEffect(() => {
    if (chapters.length > 0 && !currentChapter) {
      setCurrentChapter(chapters[0]);
    }
  }, [chapters, currentChapter]);

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
    isSaving,
    lastSaved,
    handleChapterSelect,
    handleContentChange,
    handleChangeDecision,
    handleBackClick,
    handleSave,
    refreshData
  };
};
