
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
  sendMessageWithHashVerification?: (
    popupId: string,
    message: string,
    projectId: string,
    chapterId?: string
  ) => Promise<{ shouldProceed: boolean; bannerState?: { message: string; type: 'success' | 'error' | 'loading' } }>;
} | null>(null);

export const SimplePopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [livePopups, setLivePopups] = useState<SimplePopup[]>([]);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const { saveChat, loadChatById } = useChatDatabase();
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
    try {
      // Check if already open to prevent duplication
      const existingPopup = livePopups.find(popup => popup.id === id && popup.status === 'open');
      if (existingPopup) {
        console.log('Popup already open:', id);
        return;
      }

      // Load existing popup from database
      const dbPopup = await loadChatById(id);
      if (dbPopup) {
        console.log('Loaded popup from database:', dbPopup);
        
        // Convert database popup to SimplePopup format
        const reopenedPopup: SimplePopup = {
          id: dbPopup.id,
          type: dbPopup.type as 'comment' | 'chat',
          position: dbPopup.position,
          projectId: dbPopup.projectId,
          chapterId: dbPopup.chapterId,
          selectedText: dbPopup.selectedText?.text || null,
          lineNumber: dbPopup.lineNumber || null,
          textPosition: dbPopup.selectedText?.startOffset || null,
          isMinimized: dbPopup.isMinimized,
          createdAt: new Date(dbPopup.createdAt),
          messages: dbPopup.messages || [],
          status: 'open'
        };

        // Remove any existing closed version and add the reopened one
        setLivePopups(prev => {
          const filtered = prev.filter(popup => popup.id !== id);
          return [...filtered, reopenedPopup];
        });
        
        setTimelineVersion(prev => prev + 1);
      } else {
        console.log('Popup not found in database, creating new one');
        // If not found in database, create a new popup
        await createPopup(type, position, projectId, chapterId, selectedText);
      }
    } catch (error) {
      console.error('Error reopening popup:', error);
    }
  }, [livePopups, createPopup, loadChatById]);

  const sendMessageWithHashVerification = useCallback(async (
    popupId: string,
    message: string,
    projectId: string,
    chapterId?: string
  ) => {
    try {
      // For now, we'll always proceed without hash verification
      // This can be enhanced later to include actual content hash checking
      console.log('Sending message for popup:', popupId, 'Message:', message);
      
      return {
        shouldProceed: true,
        bannerState: { message: 'Message sent successfully', type: 'success' as const }
      };
    } catch (error) {
      console.error('Error in sendMessageWithHashVerification:', error);
      return {
        shouldProceed: false,
        bannerState: { message: 'Failed to send message', type: 'error' as const }
      };
    }
  }, []);

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
    sendMessageWithHashVerification,
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
