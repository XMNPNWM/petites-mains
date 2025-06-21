
import { useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWordCount } from '@/lib/contentUtils';
import { Chapter } from '@/types/shared';

interface UseAutoSaveProps {
  currentChapter: Chapter | null;
  isSaving: boolean;
  onSaveStart: () => void;
  onSaveComplete: (date: Date) => void;
  onSaveError: (error: any) => void;
  autoSaveDelay?: number;
}

export const useAutoSave = ({
  currentChapter,
  isSaving,
  onSaveStart,
  onSaveComplete,
  onSaveError,
  autoSaveDelay = 30000
}: UseAutoSaveProps) => {
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSave = async (chapter: Chapter, isAutoSave = false) => {
    if (isSaving) return;
    
    if (!isAutoSave) onSaveStart();
    
    try {
      const wordCount = getWordCount(chapter.content);
      
      const { error } = await supabase
        .from('chapters')
        .update({ 
          content: chapter.content,
          word_count: wordCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapter.id);

      if (error) throw error;
      
      onSaveComplete(new Date());
      if (isAutoSave) {
        console.log('Chapter auto-saved successfully');
      }
    } catch (error) {
      console.error('Error saving chapter:', error);
      onSaveError(error);
    }
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (currentChapter && !isSaving) {
        performSave(currentChapter, true);
      }
    }, autoSaveDelay);
  };

  useEffect(() => {
    if (currentChapter && !isSaving) {
      scheduleAutoSave();
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentChapter?.content, isSaving]);

  const manualSave = () => {
    if (currentChapter) {
      performSave(currentChapter, false);
    }
  };

  return { manualSave };
};
