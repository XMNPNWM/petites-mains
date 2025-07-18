import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProjectData } from './useProjectData';
import { useChapterTransition } from './useChapterTransition';
import { RefinementService } from '@/services/RefinementService';
import { ChapterNavigationService } from '@/services/ChapterNavigationService';
import { ContentVersioningService } from '@/services/ContentVersioningService';
import { Chapter, RefinementData } from '@/types/shared';
import { applyTextReplacement, optimizeParagraphs } from '@/lib/textUtils';

export const useRefinementSpace = (projectId: string | undefined) => {
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [refinementData, setRefinementData] = useState<RefinementData | null>(null);
  const [previousRefinementData, setPreviousRefinementData] = useState<RefinementData | null>(null);
  const [isLoadingRefinementData, setIsLoadingRefinementData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { project, chapters } = useProjectData(projectId);
  const { transitionState, startTransition, completeTransition } = useChapterTransition();

  const fetchRefinementData = useCallback(async (chapterId: string) => {
    if (!chapterId) return;
    
    console.log('🔍 useRefinementSpace - Fetching refinement data for chapter:', chapterId);
    
    setIsLoadingRefinementData(true);
    
    try {
      // CRITICAL: Don't clear existing refinement data during transitions to prevent content jumping
      if (!transitionState.isTransitioning) {
        setRefinementData(null);
      }
      
      let data = await RefinementService.fetchRefinementData(chapterId);
      
      console.log('📊 useRefinementSpace - Refinement data fetch result:', {
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
          console.log('🆕 useRefinementSpace - Creating new refinement data for chapter:', chapter.title);
          data = await RefinementService.createRefinementData(chapterId, chapter.content || '');
        }
      } else {
        // CRITICAL VALIDATION: Ensure refinement data belongs to the correct chapter
        if (data.chapter_id !== chapterId) {
          console.error('❌ CRITICAL: Refinement data chapter mismatch!', {
            expected: chapterId,
            found: data.chapter_id
          });
          setRefinementData(null);
          setIsLoadingRefinementData(false);
          return;
        }
        
        // Update original_content if it doesn't match current chapter content
        const chapter = chapters.find(c => c.id === chapterId);
        if (chapter && chapter.content !== data.original_content) {
          console.log('🔄 useRefinementSpace - Syncing original_content with current chapter content');
          await RefinementService.updateOriginalContent(data.id, chapter.content || '');
          data.original_content = chapter.content || '';
        }
      }
      
      // Set data after validation
      if (data && data.chapter_id === chapterId) {
        console.log('✅ useRefinementSpace - Setting validated refinement data:', {
          refinementId: data.id,
          chapterId: data.chapter_id,
          hasEnhancedContent: !!data.enhanced_content,
          enhancedContentLength: data.enhanced_content?.length || 0
        });
        
        // Preserve previous data during transitions for smooth handoff
        if (transitionState.isTransitioning && refinementData) {
          setPreviousRefinementData(refinementData);
        }
        
        setRefinementData(data);
        completeTransition(); // Mark transition as complete
      } else {
        console.warn('⚠️ useRefinementSpace - Refinement data validation failed, not setting data');
        if (!transitionState.isTransitioning) {
          setRefinementData(null);
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching refinement data:', error);
      if (!transitionState.isTransitioning) {
        setRefinementData(null);
      }
      completeTransition(); // Complete transition even on error
    } finally {
      setIsLoadingRefinementData(false);
    }
  }, [chapters, completeTransition, refinementData]);

  const handleChapterSelect = useCallback((chapter: Chapter) => {
    console.log('📋 useRefinementSpace - Chapter selected:', chapter.title, chapter.id);
    
    // Prevent rapid chapter switches during transition
    if (transitionState.isTransitioning) {
      console.log('⏸️ Skipping chapter select - transition in progress');
      return;
    }

    // Guard: Don't switch if already on the same chapter
    if (currentChapter?.id === chapter.id) {
      console.log('⏸️ Skipping chapter select - already on this chapter');
      return;
    }
    
    // Start transition from current chapter to new chapter
    startTransition(currentChapter?.id || null, chapter.id);
    
    // CRITICAL: Preserve current refinement data during transition to prevent content jumping
    if (refinementData) {
      setPreviousRefinementData(refinementData);
    }
    
    setCurrentChapter(chapter);
    
    // Save selected chapter for cross-space navigation
    if (projectId) {
      ChapterNavigationService.setCurrentChapter(projectId, chapter.id);
    }
    
    // Navigate to the new chapter URL to sync URL with selected chapter
    navigate(`/project/${projectId}/refine/${chapter.id}`);
  }, [projectId, navigate, currentChapter, transitionState, startTransition, refinementData]);

  const handleContentChange = useCallback(async (content: string) => {
    if (!refinementData || !currentChapter || transitionState.isTransitioning) return;
    
    // CRITICAL VALIDATION: Ensure we're updating the correct chapter's content
    if (refinementData.chapter_id !== currentChapter.id) {
      console.error('❌ CRITICAL: Content change attempted on wrong chapter!', {
        refinementChapterId: refinementData.chapter_id,
        currentChapterId: currentChapter.id
      });
      toast({
        title: "Error",
        description: "Chapter synchronization error. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Optimize paragraph organization
      const optimizedContent = optimizeParagraphs(content);
      
      await RefinementService.updateRefinementContent(
        refinementData.id, 
        optimizedContent, 
        currentChapter.id
      );
      
      setRefinementData(prev => prev ? {
        ...prev,
        enhanced_content: optimizedContent,
        refinement_status: 'in_progress'
      } : null);
      
      // Auto-save after content change
      setLastSaved(new Date());
    } catch (error) {
      console.error('❌ Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    }
  }, [refinementData, currentChapter, toast, transitionState]);

  const handleChangeDecision = useCallback(async (changeId: string, decision: 'accepted' | 'rejected') => {
    if (!refinementData || transitionState.isTransitioning) return;
    
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
      console.error('❌ Error updating change decision:', error);
      toast({
        title: "Error",
        description: "Failed to update change decision",
        variant: "destructive"
      });
    }
  }, [toast, refinementData, handleContentChange, transitionState]);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!refinementData || !currentChapter || isSaving || transitionState.isTransitioning) return;
    
    // CRITICAL VALIDATION: Ensure we're saving the correct chapter's content
    if (refinementData.chapter_id !== currentChapter.id) {
      console.error('❌ CRITICAL: Save attempted on wrong chapter!', {
        refinementChapterId: refinementData.chapter_id,
        currentChapterId: currentChapter.id
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await RefinementService.updateRefinementContent(
        refinementData.id, 
        refinementData.enhanced_content, 
        currentChapter.id
      );
      setLastSaved(new Date());
      
      // Only show success toast for manual saves (not auto-saves)
      if (!isAutoSave) {
        toast({
          title: "Saved",
          description: "Enhanced content saved successfully",
        });
      }
    } catch (error) {
      console.error('❌ Error saving:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [refinementData, currentChapter, isSaving, toast, transitionState]);

  const handleBackClick = useCallback(() => {
    navigate(`/project/${projectId}/write`);
  }, [navigate, projectId]);

  const handleImportToCreation = useCallback(async () => {
    if (!currentChapter || !refinementData || transitionState.isTransitioning) return;
    
    // CRITICAL VALIDATION: Ensure we're importing the correct chapter's content
    if (refinementData.chapter_id !== currentChapter.id) {
      console.error('❌ CRITICAL: Import attempted on wrong chapter!', {
        refinementChapterId: refinementData.chapter_id,
        currentChapterId: currentChapter.id
      });
      toast({
        title: "Error",
        description: "Chapter synchronization error. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const result = await ContentVersioningService.importEnhancedToCreation(
        currentChapter.id,
        refinementData.id,
        refinementData.enhanced_content,
        {}
      );
      
      if (result.success) {
        toast({
          title: "Content Imported",
          description: "Enhanced content has been imported to creation space. A backup was created automatically.",
        });
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (error) {
      console.error('❌ Error importing content:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import enhanced content",
        variant: "destructive"
      });
    }
  }, [currentChapter, refinementData, toast, transitionState]);

  const refreshData = useCallback(() => {
    console.log('🔄 useRefinementSpace - Refreshing data');
    if (currentChapter && !transitionState.isTransitioning) {
      fetchRefinementData(currentChapter.id);
    }
  }, [fetchRefinementData, currentChapter, transitionState]);

  // Clear previous refinement data when transition completes
  useEffect(() => {
    if (!transitionState.isTransitioning && previousRefinementData) {
      setTimeout(() => setPreviousRefinementData(null), 500); // Small delay for smooth transition
    }
  }, [transitionState.isTransitioning, previousRefinementData]);

  // Initialize current chapter
  useEffect(() => {
    if (chapters.length > 0 && !currentChapter && projectId) {
      // Try to restore previously selected chapter
      const savedChapterId = ChapterNavigationService.getCurrentChapter(projectId);
      const savedChapter = savedChapterId ? chapters.find(c => c.id === savedChapterId) : null;
      
      // Use saved chapter or default to first chapter
      const chapterToSelect = savedChapter || chapters[0];
      console.log('🏁 useRefinementSpace - Initializing with chapter:', chapterToSelect.title);
      
      startTransition(null, chapterToSelect.id);
      setCurrentChapter(chapterToSelect);
    }
  }, [chapters, currentChapter, projectId, startTransition]);

  // Fetch refinement data when current chapter changes
  useEffect(() => {
    if (currentChapter) {
      console.log('📋 useRefinementSpace - Current chapter changed, fetching refinement data for:', currentChapter.title, currentChapter.id);
      fetchRefinementData(currentChapter.id);
    }
  }, [currentChapter, fetchRefinementData]);

  // Handle URL chapter ID synchronization
  useEffect(() => {
    const urlChapterId = window.location.pathname.split('/').pop();
    if (urlChapterId && chapters.length > 0) {
      const targetChapter = chapters.find(c => c.id === urlChapterId);
      if (targetChapter && (!currentChapter || currentChapter.id !== urlChapterId)) {
        // Guard against switching during transition
        if (transitionState.isTransitioning) {
          console.log('⏸️ Skipping URL sync - transition in progress');
          return;
        }
        
        console.log('🔗 useRefinementSpace - URL mismatch, setting current chapter from URL:', targetChapter.title, urlChapterId);
        startTransition(currentChapter?.id || null, targetChapter.id);
        setCurrentChapter(targetChapter);
      }
    }
  }, [chapters, currentChapter, startTransition, transitionState.isTransitioning]);

  return {
    project,
    chapters,
    currentChapter,
    refinementData,
    previousRefinementData,
    isLoadingRefinementData,
    isSaving,
    lastSaved,
    transitionState,
    handleChapterSelect,
    handleContentChange,
    handleChangeDecision,
    handleBackClick,
    handleSave,
    handleImportToCreation,
    refreshData
  };
};
