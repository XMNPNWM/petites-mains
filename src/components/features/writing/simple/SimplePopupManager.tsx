
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { SelectedTextContext, SimplePopupSession } from './types/popupTypes';
import { supabase } from '@/integrations/supabase/client';

interface SimplePopupContextType {
  popups: SimplePopupSession[];
  openPopup: (type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext) => void;
  closePopup: (id: string) => void;
  minimizePopup: (id: string) => void;
  createPopup: (type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string, lineNumber?: number) => Promise<void>;
  updatePopup: (id: string, updates: Partial<SimplePopupSession>) => void;
  deletePopup: (id: string) => Promise<void>;
  reopenPopup: (id: string, type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string) => Promise<void>;
  goToLine: (chapterId: string, lineNumber: number) => Promise<boolean>;
  timelineVersion: number;
  sendMessageWithHashVerification?: (popupId: string, message: string, projectId: string, chapterId?: string) => Promise<{
    success: boolean;
    bannerState?: { message: string; type: 'success' | 'error' | 'loading' } | null;
  }>;
}

const SimplePopupContext = createContext<SimplePopupContextType | undefined>(undefined);

export const useSimplePopups = () => {
  const context = useContext(SimplePopupContext);
  if (!context) {
    throw new Error('useSimplePopups must be used within a SimplePopupProvider');
  }
  return context;
};

interface SimplePopupProviderProps {
  children: ReactNode;
}

export const SimplePopupProvider = ({ children }: SimplePopupProviderProps) => {
  const [popups, setPopups] = useState<SimplePopupSession[]>([]);
  const [timelineVersion, setTimelineVersion] = useState(0);

  const incrementTimelineVersion = useCallback(() => {
    setTimelineVersion(prev => prev + 1);
  }, []);

  const openPopup = useCallback((type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext) => {
    console.log('Opening popup:', { type, position, projectId, chapterId, selectedText });
    
    // Ensure position is within viewport bounds
    const safePosition = {
      x: Math.max(20, Math.min(position.x, window.innerWidth - 420)),
      y: Math.max(20, Math.min(position.y, window.innerHeight - 520))
    };

    const newPopup: SimplePopupSession = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      position: safePosition,
      isMinimized: false,
      createdAt: new Date(),
      projectId,
      chapterId,
      selectedText: selectedText?.text,
      lineNumber: selectedText?.lineNumber,
      textPosition: selectedText?.startOffset,
      messages: type === 'comment' && selectedText ? [{
        role: 'assistant',
        content: `You're commenting on: "${selectedText.text}"\n\nWhat would you like to note about this text?`,
        timestamp: new Date()
      }] : [],
      status: 'open'
    };
    
    setPopups(prev => [...prev, newPopup]);
    incrementTimelineVersion();
  }, [incrementTimelineVersion]);

  const createPopup = useCallback(async (type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string, lineNumber?: number) => {
    const selectedTextContext: SelectedTextContext | undefined = selectedText ? {
      text: selectedText,
      startOffset: 0,
      endOffset: selectedText.length,
      lineNumber
    } : undefined;
    
    openPopup(type, position, projectId, chapterId, selectedTextContext);
  }, [openPopup]);

  const updatePopup = useCallback((id: string, updates: Partial<SimplePopupSession>) => {
    console.log('Updating popup:', id, updates);
    setPopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, ...updates } : popup
    ));
  }, []);

  const closePopup = useCallback((id: string) => {
    console.log('Closing popup:', id);
    setPopups(prev => prev.filter(popup => popup.id !== id));
    incrementTimelineVersion();
  }, [incrementTimelineVersion]);

  const deletePopup = useCallback(async (id: string) => {
    console.log('Deleting popup permanently:', id);
    
    // Remove from state
    setPopups(prev => prev.filter(popup => popup.id !== id));
    
    // Delete from database
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting popup from database:', error);
      }
    } catch (error) {
      console.error('Failed to delete popup from database:', error);
    }
    
    incrementTimelineVersion();
  }, [incrementTimelineVersion]);

  const reopenPopup = useCallback(async (id: string, type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string) => {
    console.log('Reopening popup:', id);
    
    // Check if already open
    const existingPopup = popups.find(p => p.id === id);
    if (existingPopup) {
      console.log('Popup already open:', id);
      return;
    }

    try {
      // Load from database
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error loading popup from database:', error);
        return;
      }

      // Convert to popup format
      const reopenedPopup: SimplePopupSession = {
        id: data.id,
        type: data.chat_type as 'comment' | 'chat',
        position: data.position as { x: number; y: number },
        isMinimized: data.is_minimized,
        createdAt: new Date(data.created_at),
        projectId: data.project_id,
        chapterId: data.chapter_id,
        selectedText: data.selected_text,
        lineNumber: data.line_number,
        textPosition: data.text_position,
        messages: (data.messages as any[])?.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) || [],
        status: 'open'
      };

      setPopups(prev => [...prev, reopenedPopup]);
    } catch (error) {
      console.error('Failed to reopen popup:', error);
    }
  }, [popups]);

  const goToLine = useCallback(async (chapterId: string, lineNumber: number): Promise<boolean> => {
    try {
      console.log('Navigation request:', { chapterId, lineNumber });
      
      // For now, just log the navigation request
      // In a real implementation, this would navigate to the specific line
      // and return true if successful, false if failed
      
      // Simulate navigation logic
      if (chapterId && lineNumber > 0) {
        console.log(`Navigating to chapter ${chapterId}, line ${lineNumber}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Navigation failed:', error);
      return false;
    }
  }, []);

  const minimizePopup = useCallback((id: string) => {
    console.log('Minimizing popup:', id);
    setPopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, isMinimized: !popup.isMinimized } : popup
    ));
  }, []);

  const sendMessageWithHashVerification = useCallback(async (
    popupId: string, 
    message: string, 
    projectId: string, 
    chapterId?: string
  ): Promise<{
    success: boolean;
    bannerState?: { message: string; type: 'success' | 'error' | 'loading' } | null;
  }> => {
    try {
      console.log('🚀 SimplePopupManager: Starting message send process', { 
        popupId, 
        projectId, 
        chapterId, 
        messageLength: message.length 
      });

      // Add user message immediately to UI
      const userMessage = {
        role: 'user' as const,
        content: message,
        timestamp: new Date()
      };

      console.log('📝 SimplePopupManager: Adding user message to popup', popupId);
      setPopups(prev => prev.map(popup => 
        popup.id === popupId 
          ? { ...popup, messages: [...(popup.messages || []), userMessage] }
          : popup
      ));

      // Call the chat-with-ai edge function
      console.log('📡 SimplePopupManager: Calling chat-with-ai edge function...');
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message,
          projectId,
          chapterId
        }
      });

      console.log('📨 SimplePopupManager: Edge function response received', { 
        hasData: !!data, 
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [],
        errorMessage: error?.message
      });

      if (error) {
        console.error('❌ SimplePopupManager: Edge function error:', error);
        return {
          success: false,
          bannerState: {
            message: `AI service failed: ${error.message}`,
            type: 'error'
          }
        };
      }

      if (!data?.success) {
        console.error('❌ SimplePopupManager: Edge function returned error:', data);
        return {
          success: false,
          bannerState: {
            message: `AI service failed: ${data?.error || 'Unknown error'}`,
            type: 'error'
          }
        };
      }

      console.log('✅ SimplePopupManager: AI response received successfully', {
        responseLength: data.response?.length || 0,
        processingTime: data.processingTime
      });

      // Add AI response to UI
      const aiMessage = {
        role: 'assistant' as const,
        content: data.response,
        timestamp: new Date()
      };

      console.log('📝 SimplePopupManager: Adding AI message to popup', popupId);
      setPopups(prev => prev.map(popup => 
        popup.id === popupId 
          ? { ...popup, messages: [...(popup.messages || []), aiMessage] }
          : popup
      ));

      console.log('✅ SimplePopupManager: Message exchange completed successfully');

      return {
        success: true,
        bannerState: {
          message: 'Response received successfully',
          type: 'success'
        }
      };

    } catch (error) {
      console.error('❌ SimplePopupManager: Error in sendMessageWithHashVerification:', error);
      console.error('❌ SimplePopupManager: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      return {
        success: false,
        bannerState: {
          message: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        }
      };
    }
  }, []);

  return (
    <SimplePopupContext.Provider value={{ 
      popups, 
      openPopup, 
      closePopup, 
      minimizePopup,
      createPopup,
      updatePopup,
      deletePopup,
      reopenPopup,
      goToLine,
      timelineVersion,
      sendMessageWithHashVerification
    }}>
      {children}
    </SimplePopupContext.Provider>
  );
};
