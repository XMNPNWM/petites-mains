
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { SelectedTextContext, SimplePopupSession } from './types/popupTypes';
import { supabase } from '@/integrations/supabase/client';

interface SimplePopupContextType {
  popups: SimplePopupSession[];
  openPopup: (type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext) => void;
  closePopup: (id: string) => void;
  minimizePopup: (id: string) => void;
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
      selectedText,
      messages: type === 'comment' && selectedText ? [{
        role: 'assistant',
        content: `You're commenting on: "${selectedText.text}"\n\nWhat would you like to note about this text?`,
        timestamp: new Date()
      }] : []
    };
    
    setPopups(prev => [...prev, newPopup]);
  }, []);

  const closePopup = useCallback((id: string) => {
    console.log('Closing popup:', id);
    setPopups(prev => prev.filter(popup => popup.id !== id));
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
      console.log('Sending message via edge function:', { popupId, projectId, chapterId });

      // Add user message immediately to UI
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

      // Call the chat-with-ai edge function
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message,
          projectId,
          chapterId
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return {
          success: false,
          bannerState: {
            message: `AI service failed: ${error.message}`,
            type: 'error'
          }
        };
      }

      if (!data?.success) {
        console.error('Edge function returned error:', data);
        return {
          success: false,
          bannerState: {
            message: `AI service failed: ${data?.error || 'Unknown error'}`,
            type: 'error'
          }
        };
      }

      // Add AI response to UI
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

      return {
        success: true,
        bannerState: {
          message: 'Response received successfully',
          type: 'success'
        }
      };

    } catch (error) {
      console.error('Error in sendMessageWithHashVerification:', error);
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
      sendMessageWithHashVerification
    }}>
      {children}
    </SimplePopupContext.Provider>
  );
};
