
import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePopupNavigation } from './hooks/usePopupNavigation';
import { usePopupCreation } from './hooks/usePopupCreation';
import { useDragBehavior } from './hooks/useDragBehavior';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { SimplePopup } from './types/popupTypes';
import { useChatDatabase } from '@/hooks/useChatDatabase';

interface SimplePopupManagerProps {
  projectId: string;
  chapterId?: string;
  textContent: string;
  popups: SimplePopup[];
  setPopups: React.Dispatch<React.SetStateAction<SimplePopup[]>>;
  onTextSelect?: (selection: { text: string; range: Range }) => void;
}

const SimplePopupContext = createContext<{
  livePopups: SimplePopup[];
  popups: SimplePopup[];
  createPopup: (
    type: 'comment' | 'chat',
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string,
    lineNumber?: number
  ) => Promise<void>;
  updatePopup: (id: string, updates: Partial<SimplePopup>) => void;
  closePopup: (id: string) => Promise<void>;
  deletePopup: (id: string) => Promise<void>;
  reopenPopup: (
    id: string,
    type: 'comment' | 'chat',
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string
  ) => Promise<void>;
  goToLine: (chapterId: string, lineNumber: number) => Promise<boolean>;
  timelineVersion: number;
} | null>(null);

export const SimplePopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [livePopups, setLivePopups] = useState<SimplePopup[]>([]);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const { saveChat } = useChatDatabase();
  const { goToLine } = usePopupNavigation();
  const { createPopupData } = usePopupCreation();

  const createPopup = useCallback(async (
    type: 'comment' | 'chat',
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string,
    lineNumber?: number
  ) => {
    const newPopup = createPopupData(type, position, projectId, chapterId, selectedText, lineNumber);
    setLivePopups(prev => [...prev, newPopup]);
    setTimelineVersion(prev => prev + 1);

    // Save to database
    try {
      const chatSession = {
        id: newPopup.id,
        type: newPopup.type,
        position: newPopup.position,
        isMinimized: newPopup.isMinimized,
        createdAt: newPopup.createdAt,
        projectId: newPopup.projectId,
        chapterId: newPopup.chapterId,
        selectedText: newPopup.selectedText ? {
          text: newPopup.selectedText,
          startOffset: newPopup.textPosition || 0,
          endOffset: (newPopup.textPosition || 0) + newPopup.selectedText.length,
          lineNumber: newPopup.lineNumber
        } : undefined,
        lineNumber: newPopup.lineNumber,
        messages: newPopup.messages,
        status: 'active' as const
      };

      await saveChat(chatSession);
    } catch (error) {
      console.error('Failed to save popup to database:', error);
    }
  }, [createPopupData, saveChat]);

  const updatePopup = useCallback((id: string, updates: Partial<SimplePopup>) => {
    setLivePopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, ...updates } : popup
    ));
  }, []);

  const closePopup = useCallback(async (id: string) => {
    setLivePopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, status: 'closed' } : popup
    ));
    setTimelineVersion(prev => prev + 1);
  }, []);

  const deletePopup = useCallback(async (id: string) => {
    setLivePopups(prev => prev.filter(popup => popup.id !== id));
    setTimelineVersion(prev => prev + 1);
  }, []);

  const reopenPopup = useCallback(async (
    id: string,
    type: 'comment' | 'chat',
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string
  ) => {
    // Check if already open
    const existingPopup = livePopups.find(popup => popup.id === id);
    if (existingPopup && existingPopup.status === 'open') {
      return;
    }

    // Create or reopen popup
    if (existingPopup) {
      updatePopup(id, { status: 'open', position });
    } else {
      // This would typically load from database, but for now create new
      await createPopup(type, position, projectId, chapterId, selectedText);
    }
  }, [livePopups, updatePopup, createPopup]);

  const value = {
    livePopups,
    popups: livePopups,
    createPopup,
    updatePopup,
    closePopup,
    deletePopup,
    reopenPopup,
    goToLine,
    timelineVersion,
  };

  return (
    <SimplePopupContext.Provider value={value}>
      {children}
    </SimplePopupContext.Provider>
  );
};

export const useSimplePopups = () => {
  const context = useContext(SimplePopupContext);
  if (!context) {
    throw new Error('useSimplePopups must be used within a SimplePopupProvider');
  }
  return context;
};

// Legacy component for backward compatibility
const SimplePopupManager = ({ 
  projectId, 
  chapterId, 
  textContent, 
  popups, 
  setPopups,
  onTextSelect 
}: SimplePopupManagerProps) => {
  return null; // This component is now deprecated in favor of the provider pattern
};

export default SimplePopupManager;
