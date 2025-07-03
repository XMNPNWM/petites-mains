import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePopupNavigation } from './hooks/usePopupNavigation';
import { usePopupCreation } from './hooks/usePopupCreation';
import { useDragBehavior } from './hooks/useDragBehavior';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { ContentHashService } from '@/services/ContentHashService';
import { SimplePopup } from './types/popupTypes';
import { useChatDatabase } from '@/hooks/useChatDatabase';
import { supabase } from '@/integrations/supabase/client';

interface SimplePopupState {
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
  sendMessageWithHashVerification?: (
    popupId: string,
    message: string,
    projectId: string,
    chapterId?: string
  ) => Promise<{ success: boolean; bannerState?: { message: string; type: 'success' | 'error' | 'loading' } }>;
}

interface SimplePopupContextType {
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
  sendMessageWithHashVerification?: (
    popupId: string,
    message: string,
    projectId: string,
    chapterId?: string
  ) => Promise<{ success: boolean; bannerState?: { message: string; type: 'success' | 'error' | 'loading' } }>;
}

const SimplePopupContext = createContext<SimplePopupContextType | undefined>(undefined);

export const useSimplePopups = () => {
  const context = useContext(SimplePopupContext);
  if (!context) {
    throw new Error('useSimplePopups must be used within a SimplePopupProvider');
  }
  return context;
};

export const SimplePopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [popups, setPopups] = useState<SimplePopup[]>([]);
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
    setPopups(prev => [...prev, newPopup]);
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
    setPopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, ...updates } : popup
    ));
  }, []);

  const closePopup = useCallback(async (id: string) => {
    setPopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, status: 'closed' } : popup
    ));
    setTimelineVersion(prev => prev + 1);
  }, []);

  const deletePopup = useCallback(async (id: string) => {
    console.log('🗑️ Deleting popup with database cleanup:', id);
    
    try {
      // Remove from state immediately
      setPopups(prev => prev.filter(popup => popup.id !== id));
      
      // Clean up from database
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Failed to delete from database:', error);
        // Don't re-add to state even if database deletion fails
        // The popup should remain deleted from UI
      } else {
        console.log('✅ Popup deleted from database successfully');
      }
    } catch (error) {
      console.error('Error during popup deletion:', error);
      // Popup stays deleted from UI regardless of database errors
    }
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
      const existingPopup = popups.find(popup => popup.id === id && popup.status === 'open');
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
        setPopups(prev => {
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
  }, [popups, createPopup, loadChatById]);

  const sendMessageWithHashVerification = useCallback(async (
    popupId: string, 
    message: string, 
    projectId: string, 
    chapterId?: string
  ) => {
    console.log('🔄 Starting hash verification workflow:', { popupId, projectId, chapterId });
    
    try {
      let shouldAnalyze = false;
      
      // Step 1: Hash verification if we have a chapter
      if (chapterId) {
        console.log('📋 Checking content hash for chapter:', chapterId);
        
        try {
          const hashResult = await ContentHashService.verifyContentHash(chapterId);
          console.log('🔍 Hash verification result:', hashResult);
          
          if (!hashResult.isValid) {
            console.log('🚨 Content hash mismatch - analysis needed');
            shouldAnalyze = true;
          }
        } catch (hashError) {
          console.error('❌ Hash verification failed:', hashError);
          // Continue without hash verification rather than blocking
          console.log('⚠️ Continuing without hash verification');
        }
      }

      // Step 2: Show analyzing banner if needed
      if (shouldAnalyze) {
        console.log('🧠 Starting content analysis before AI chat');
        
        return {
          success: false,
          bannerState: { 
            message: 'Analyzing latest content changes before responding...', 
            type: 'loading' as const 
          }
        };
      }

      // Step 3: Add user message to popup immediately
      const userMessage = {
        role: 'user' as const,
        content: message,
        timestamp: new Date()
      };

      setPopups(prev => prev.map(popup => 
        popup.id === popupId 
          ? { ...popup, messages: [...(popup.messages || []), userMessage] }
          : popup
      ));

      // Step 4: Save user message to database
      try {
        const { error: saveError } = await supabase
          .from('chat_sessions')
          .upsert({
            id: popupId,
            project_id: projectId,
            chapter_id: chapterId,
            chat_type: 'chat',
            messages: [userMessage],
            position: { x: 100, y: 100 },
            status: 'active',
            selected_text: null
          });

        if (saveError) {
          console.error('Failed to save user message:', saveError);
        }
      } catch (dbError) {
        console.error('Database error saving user message:', dbError);
      }

      // Step 5: Call AI service
      console.log('🤖 Calling AI service with:', { message, projectId, chapterId });
      
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { 
          message, 
          projectId, 
          chapterId 
        }
      });

      console.log('🤖 AI service response:', { data, error });

      if (error) {
        console.error('❌ AI service error:', error);
        throw new Error(`AI service failed: ${error.message}`);
      }

      if (!data?.success || !data?.response) {
        console.error('❌ Invalid AI response:', data);
        throw new Error(data?.error || 'AI service returned invalid response');
      }

      // Step 6: Add AI response to popup
      const aiMessage = {
        role: 'assistant' as const,
        content: data.response,
        timestamp: new Date()
      };

      setPopups(prev => prev.map(popup => 
        popup.id === popupId 
          ? { ...popup, messages: [...(popup.messages || []), aiMessage] }
          : popup
      ));

      // Step 7: Save AI message to database
      try {
        const { error: saveAiError } = await supabase
          .from('chat_sessions')
          .upsert({
            id: popupId,
            project_id: projectId,
            chapter_id: chapterId,
            chat_type: 'chat',
            messages: [userMessage, aiMessage],
            position: { x: 100, y: 100 },
            status: 'active',
            selected_text: null
          });

        if (saveAiError) {
          console.error('Failed to save AI message:', saveAiError);
        }
      } catch (dbError) {
        console.error('Database error saving AI message:', dbError);
      }

      console.log('✅ Hash verification workflow completed successfully');
      
      return {
        success: true,
        bannerState: { 
          message: 'Message sent successfully!', 
          type: 'success' as const 
        }
      };

    } catch (error) {
      console.error('❌ Hash verification workflow failed:', error);
      
      return {
        success: false,
        bannerState: { 
          message: error instanceof Error ? error.message : 'Failed to send message', 
          type: 'error' as const 
        }
      };
    }
  }, []);

  const value = {
    popups,
    createPopup,
    updatePopup,
    closePopup,
    deletePopup,
    reopenPopup,
    sendMessageWithHashVerification
  };

  return (
    <SimplePopupContext.Provider value={value}>
      {children}
    </SimplePopupContext.Provider>
  );
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
