import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProjectData } from './useProjectData';
import { RefinementService } from '@/services/RefinementService';
import { ChapterNavigationService } from '@/services/ChapterNavigationService';
import { ContentVersioningService } from '@/services/ContentVersioningService';
import { Chapter, RefinementData } from '@/types/shared';
import { applyTextReplacement, optimizeParagraphs } from '@/lib/textUtils';

export const useRefinementSpace = (projectId: string | undefined) => {
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [refinementData, setRefinementData] = useState<RefinementData | null>(null);
  const [isLoadingRefinementData, setIsLoadingRefinementData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { project, chapters } = useProjectData(projectId);

  const fetchRefinementData = useCallback(async (chapterId: string) => {
    if (!chapterId) return;
    
    console.log('useRefinementSpace - Fetching refinement data for chapter:', chapterId);
    
    setIsLoadingRefinementData(true);
    
    try {
      let data = await RefinementService.fetchRefinementData(chapterId);
      
      console.log('useRefinementSpace - Initial refinement data fetch result:', {
        hasData: !!data,
        chapterId: data?.chapter_id,
        hasOriginalContent: !!data?.original_content,
        hasEnhancedContent: !!data?.enhanced_content,
        enhancedContentLength: data?.enhanced_content?.length || 0,
        status: data?.refinement_status
      });
      
      if (!data) {
        const chapter = chapters.find(c => c.id === chapterId);
        if (chapter) {
          console.log('useRefinementSpace - Creating new refinement data for chapter:', chapter.title);
          data = await RefinementService.createRefinementData(chapterId, chapter.content || '');
        }
      }
      
      console.log('useRefinementSpace - Final refinement data set:', {
        hasData: !!data,
        hasEnhancedContent: !!data?.enhanced_content,
        enhancedContentLength: data?.enhanced_content?.length || 0
      });
      
      setRefinementData(data);
    } catch (error) {
      console.error('Error fetching refinement data:', error);
      setRefinementData(null);
    } finally {
      setIsLoadingRefinementData(false);
    }
  }, [chapters]);

  const handleChapterSelect = useCallback((chapter: Chapter) => {
    setCurrentChapter(chapter);
    
    // Save selected chapter for cross-space navigation
    if (projectId) {
      ChapterNavigationService.setCurrentChapter(projectId, chapter.id);
    }
    
    // Navigate to the new chapter URL to sync URL with selected chapter
    navigate(`/project/${projectId}/refine/${chapter.id}`);
  }, [projectId, navigate]);

  const handleContentChange = useCallback(async (content: string) => {
    if (!refinementData) return;
    
    try {
      // Optimize paragraph organization
      const optimizedContent = optimizeParagraphs(content);
      
      await RefinementService.updateRefinementContent(refinementData.id, optimizedContent);
      
      setRefinementData(prev => prev ? {
        ...prev,
        enhanced_content: optimizedContent,
        refinement_status: 'in_progress'
      } : null);
      
      // Auto-save after content change
      setLastSaved(new Date());
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
    if (!refinementData) return;
    
    try {
      // First get the change details
      const { data: change, error: changeError } = await supabase
        .from('ai_change_tracking')
        .select('*')
        .eq('id', changeId)
        .single();

      if (changeError) throw changeError;

      // Update the change decision in database
      const { error } = await supabase
        .from('ai_change_tracking')
        .update({ user_decision: decision })
        .eq('id', changeId);

      if (error) throw error;

      // If change is rejected, apply the original text to enhanced content
      if (decision === 'rejected' && change) {
        const currentContent = refinementData.enhanced_content || '';
        const newContent = applyTextReplacement(
          currentContent,
          change.position_start,
          change.position_end,
          change.original_text
        );
        
        // Update the enhanced content
        await handleContentChange(newContent);
      }
      
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
  }, [toast, refinementData, handleContentChange]);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!refinementData || isSaving) return;
    
    setIsSaving(true);
    try {
      await RefinementService.updateRefinementContent(refinementData.id, refinementData.enhanced_content);
      setLastSaved(new Date());
      
      // Only show success toast for manual saves (not auto-saves)
      if (!isAutoSave) {
        toast({
          title: "Saved",
          description: "Enhanced content saved successfully",
        });
      }
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

  const handleImportToCreation = useCallback(async () => {
    if (!currentChapter || !refinementData) return;
    
    try {
      const result = await ContentVersioningService.importEnhancedToCreation(
        currentChapter.id,
        refinementData.id,
        refinementData.enhanced_content,
        {} // enhancement options if needed
      );
      
      if (result.success) {
        toast({
          title: "Content Imported",
          description: "Enhanced content has been imported to creation space. A backup was created automatically.",
        });
        
        // Optionally navigate to writing space
        // navigate(`/project/${projectId}/write/${currentChapter.id}`);
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing content:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import enhanced content",
        variant: "destructive"
      });
    }
  }, [currentChapter, refinementData, toast]);

  const refreshData = useCallback(() => {
    if (currentChapter) {
      fetchRefinementData(currentChapter.id);
    }
  }, [fetchRefinementData, currentChapter]);

  useEffect(() => {
    if (chapters.length > 0 && !currentChapter && projectId) {
      // Try to restore previously selected chapter
      const savedChapterId = ChapterNavigationService.getCurrentChapter(projectId);
      const savedChapter = savedChapterId ? chapters.find(c => c.id === savedChapterId) : null;
      
      // Use saved chapter or default to first chapter
      const chapterToSelect = savedChapter || chapters[0];
      setCurrentChapter(chapterToSelect);
    }
  }, [chapters, currentChapter, projectId]);

  useEffect(() => {
    if (currentChapter) {
      console.log('useRefinementSpace - Current chapter changed, fetching refinement data for:', currentChapter.title, currentChapter.id);
      fetchRefinementData(currentChapter.id);
    }
  }, [currentChapter, fetchRefinementData]);

  // Handle URL chapter ID synchronization - prioritize URL over saved state
  useEffect(() => {
    const urlChapterId = window.location.pathname.split('/').pop();
    if (urlChapterId && chapters.length > 0) {
      const targetChapter = chapters.find(c => c.id === urlChapterId);
      if (targetChapter && (!currentChapter || currentChapter.id !== urlChapterId)) {
        console.log('useRefinementSpace - URL mismatch, setting current chapter from URL:', targetChapter.title, urlChapterId);
        // Only set current chapter - let the main chapter effect handle data fetching
        setCurrentChapter(targetChapter);
      }
    }
  }, [chapters, currentChapter]);

  return {
    project,
    chapters,
    currentChapter,
    refinementData,
    isLoadingRefinementData,
    isSaving,
    lastSaved,
    handleChapterSelect,
    handleContentChange,
    handleChangeDecision,
    handleBackClick,
    handleSave,
    handleImportToCreation,
    refreshData
  };
};
