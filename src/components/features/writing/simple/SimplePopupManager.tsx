
import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePopupNavigation } from './hooks/usePopupNavigation';
import { usePopupCreation } from './hooks/usePopupCreation';
import { useDragBehavior } from './hooks/useDragBehavior';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { ContentHashService } from '@/services/ContentHashService';
import { SimplePopup } from './types/popupTypes';
import { useChatDatabase } from '@/hooks/useChatDatabase';
import { supabase } from '@/integrations/supabase/client';

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
  const { saveChat, loadChatById, deleteChat } = useChatDatabase();
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
    console.log('Deleting popup:', id);
    
    // Remove from live state
    setLivePopups(prev => prev.filter(popup => popup.id !== id));
    setTimelineVersion(prev => prev + 1);
    
    // Delete from database
    try {
      await deleteChat(id);
      console.log('Popup successfully deleted from database:', id);
    } catch (error) {
      console.error('Failed to delete popup from database:', error);
    }
  }, [deleteChat]);

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
      console.log('Starting hash verification workflow for:', { popupId, projectId, chapterId });
      
      // Step 1: Check if content has changed and needs analysis
      if (chapterId) {
        // Get current chapter content
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .select('content')
          .eq('id', chapterId)
          .single();

        if (chapterError) {
          console.error('Error fetching chapter:', chapterError);
          return {
            shouldProceed: false,
            bannerState: { message: 'Failed to verify content', type: 'error' as const }
          };
        }

        if (chapter?.content) {
          console.log('Verifying content hash...');
          const hashVerification = await ContentHashService.verifyContentHash(chapterId, chapter.content);
          
          if (hashVerification.hasChanges || hashVerification.needsReanalysis) {
            console.log('Content has changed, triggering analysis...');
            
            // Step 2: Trigger analysis if content has changed
            try {
              await SmartAnalysisOrchestrator.analyzeChapter(projectId, chapterId);
              console.log('Analysis completed successfully');
            } catch (analysisError) {
              console.error('Analysis failed:', analysisError);
              // Continue with chat even if analysis fails
            }
          } else {
            console.log('Content is up to date, proceeding with chat');
          }
        }
      }

      // Step 3: Send message to AI chat service
      console.log('Sending message to AI service...');
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message,
          projectId,
          chapterId
        }
      });

      if (aiError) {
        console.error('AI service error:', aiError);
        return {
          shouldProceed: false,
          bannerState: { message: 'AI service failed', type: 'error' as const }
        };
      }

      if (!aiResponse?.success) {
        console.error('AI response error:', aiResponse?.error);
        return {
          shouldProceed: false,
          bannerState: { message: aiResponse?.error || 'AI response failed', type: 'error' as const }
        };
      }

      // Step 4: Add both user message and AI response to popup
      const userMessage = {
        role: 'user' as const,
        content: message,
        timestamp: new Date()
      };

      const assistantMessage = {
        role: 'assistant' as const,
        content: aiResponse.response,
        timestamp: new Date()
      };

      // Update popup with both messages
      setLivePopups(prev => prev.map(popup => {
        if (popup.id === popupId) {
          const updatedMessages = [...(popup.messages || []), userMessage, assistantMessage];
          const updatedPopup = { ...popup, messages: updatedMessages };
          
          // Save updated popup to database
          const chatSession = {
            id: popup.id,
            type: popup.type,
            position: popup.position,
            isMinimized: popup.isMinimized,
            createdAt: popup.createdAt,
            projectId: popup.projectId,
            chapterId: popup.chapterId,
            selectedText: popup.selectedText ? {
              text: popup.selectedText,
              startOffset: popup.textPosition || 0,
              endOffset: (popup.textPosition || 0) + popup.selectedText.length,
              lineNumber: popup.lineNumber
            } : undefined,
            lineNumber: popup.lineNumber,
            messages: updatedMessages,
            status: 'active' as const
          };
          
          saveChat(chatSession).catch(error => {
            console.error('Failed to save chat session:', error);
          });
          
          return updatedPopup;
        }
        return popup;
      }));

      console.log('Chat interaction completed successfully');
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
  }, [saveChat]);

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
