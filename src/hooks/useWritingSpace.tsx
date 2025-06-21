
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useProjectData } from './useProjectData';
import { useAutoSave } from './useAutoSave';
import { ChapterService } from '@/services/ChapterService';
import { Chapter } from '@/types/shared';

export const useWritingSpace = () => {
  const { projectId, chapterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { project, chapters, refreshChapters } = useProjectData(projectId);

  const handleSaveStart = useCallback(() => setIsSaving(true), []);
  const handleSaveComplete = useCallback((date: Date) => {
    setLastSaved(date);
    setIsSaving(false);
  }, []);
  const handleSaveError = useCallback((error: any) => {
    setIsSaving(false);
    toast({
      title: "Save failed",
      description: "Failed to save your changes. Please try again.",
      variant: "destructive",
    });
  }, [toast]);

  const { manualSave } = useAutoSave({
    currentChapter,
    isSaving,
    onSaveStart: handleSaveStart,
    onSaveComplete: handleSaveComplete,
    onSaveError: handleSaveError
  });

  const fetchChapter = useCallback(async (id: string) => {
    const chapter = await ChapterService.fetchChapter(id);
    if (chapter) {
      setCurrentChapter(chapter);
    }
  }, []);

  const handleChapterSelect = useCallback((chapter: Chapter) => {
    setCurrentChapter(chapter);
    navigate(`/project/${projectId}/write/${chapter.id}`);
  }, [navigate, projectId]);

  const handleSave = useCallback(async () => {
    if (!currentChapter || isSaving) return;
    
    setIsSaving(true);
    
    try {
      await ChapterService.updateChapter(currentChapter);
      setLastSaved(new Date());
      toast({
        title: "Chapter saved",
        description: "Your changes have been saved successfully.",
      });
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
  }, [currentChapter, isSaving, toast]);

  const handleContentChange = useCallback((content: string) => {
    setCurrentChapter(prev => prev ? {...prev, content} : null);
  }, []);

  const handleBackClick = useCallback(() => {
    navigate(`/project/${projectId}`);
  }, [navigate, projectId]);

  // Initialize chapter if chapterId is provided
  useState(() => {
    if (chapterId) {
      fetchChapter(chapterId);
    }
  });

  return {
    projectId,
    project,
    chapters,
    currentChapter,
    isSaving,
    lastSaved,
    handleChapterSelect,
    handleSave: manualSave,
    handleContentChange,
    handleBackClick,
    refreshChapters
  };
};
