import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatDatabase } from '@/hooks/useChatDatabase';

export interface SimplePopup {
  id: string;
  type: 'comment' | 'chat';
  position: { x: number; y: number };
  projectId: string;
  chapterId?: string;
  selectedText: string | null; // Changed from optional to required (can be null)
  lineNumber?: number;
  isMinimized: boolean;
  createdAt: Date;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  status: 'open' | 'closed';
  textPosition: number | null;
}

interface SimplePopupsContextProps {
  livePopups: SimplePopup[];
  popups: SimplePopup[];
  createPopup: (type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string, lineNumber?: number) => void;
  updatePopup: (id: string, updates: Partial<SimplePopup>) => void;
  closePopup: (id: string) => void;
  deletePopup: (id: string) => void;
  reopenPopup: (id: string, type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string) => void;
  goToLine: (chapterId: string, lineNumber: number) => Promise<void>;
  timelineVersion: number;
}

const SimplePopupsContext = createContext<SimplePopupsContextProps | undefined>(undefined);

export const useSimplePopups = () => {
  const context = useContext(SimplePopupsContext);
  if (!context) {
    throw new Error('useSimplePopups must be used within a SimplePopupProvider');
  }
  return context;
};

export const SimplePopupProvider = ({ children }: { children: React.ReactNode }) => {
  const [livePopups, setLivePopups] = useState<SimplePopup[]>([]);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { saveChat, loadChatById, updateChatStatus, deleteChat } = useChatDatabase();

  const createPopup = async (
    type: 'comment' | 'chat', 
    position: { x: number; y: number }, 
    projectId: string, 
    chapterId?: string, 
    selectedText?: string, 
    lineNumber?: number
  ) => {
    console.log('Creating popup:', { type, position, projectId, chapterId, selectedText, lineNumber });

    const safePosition = {
      x: Math.max(20, Math.min(position.x, window.innerWidth - (type === 'comment' ? 370 : 470))),
      y: Math.max(20, Math.min(position.y, window.innerHeight - (type === 'comment' ? 420 : 570)))
    };

    const newPopup: SimplePopup = {
      id: uuidv4(),
      type,
      position: safePosition,
      projectId,
      chapterId,
      selectedText: selectedText || null, // Always provide a value (string or null)
      lineNumber,
      isMinimized: false,
      createdAt: new Date(),
      messages: [],
      status: 'open',
      textPosition: selectedText ? 0 : null
    };

    // Add initial message for comment type
    if (type === 'comment' && selectedText) {
      newPopup.messages = [{
        role: 'assistant',
        content: `You're commenting on: "${selectedText}"\n\nWhat would you like to note about this text?`,
        timestamp: new Date()
      }];
    } else if (type === 'chat') {
      newPopup.messages = [{
        role: 'assistant',
        content: `Hello! I'm your AI writing assistant. I have access to all your project chapters and I'm here to help you with your story. What would you like to discuss?`,
        timestamp: new Date()
      }];
    }

    setLivePopups(prevPopups => [...prevPopups, newPopup]);
    setTimelineVersion(prev => prev + 1);

    // Save to database
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

    try {
      await saveChat(chatSession);
      console.log('Popup saved to database:', newPopup.id);
    } catch (error) {
      console.error('Failed to save popup to database:', error);
    }
  };

  const updatePopup = (id: string, updates: Partial<SimplePopup>) => {
    setLivePopups(prevPopups => 
      prevPopups.map(popup => 
        popup.id === id ? { ...popup, ...updates } : popup
      )
    );
    setTimelineVersion(prev => prev + 1);
  };

  const closePopup = async (id: string) => {
    setLivePopups(prevPopups => prevPopups.filter(popup => popup.id !== id));
    setTimelineVersion(prev => prev + 1);

    try {
      await updateChatStatus(id, 'closed');
      console.log('Popup marked as closed in database:', id);
    } catch (error) {
      console.error('Failed to update popup status:', error);
    }
  };

  const deletePopup = async (id: string) => {
    setLivePopups(prevPopups => prevPopups.filter(popup => popup.id !== id));
    setTimelineVersion(prev => prev + 1);

    try {
      await deleteChat(id);
      console.log('Popup permanently deleted from database:', id);
    } catch (error) {
      console.error('Failed to delete popup from database:', error);
    }
  };

  const reopenPopup = async (
    id: string, 
    type: 'comment' | 'chat', 
    position: { x: number; y: number }, 
    projectId: string, 
    chapterId?: string, 
    selectedText?: string
  ) => {
    console.log('Reopening popup with enhanced data restoration:', id);

    const existingPopup = livePopups.find(popup => popup.id === id);
    if (existingPopup) {
      console.log('Popup is already open:', id);
      return;
    }

    try {
      const dbChat = await loadChatById(id);
      if (!dbChat) {
        console.error('Popup not found in database:', id);
        return;
      }

      console.log('Loaded chat data for reopening:', dbChat);

      const safePosition = {
        x: Math.max(20, Math.min(position.x + 30, window.innerWidth - (type === 'comment' ? 370 : 470))),
        y: Math.max(20, Math.min(position.y + 30, window.innerHeight - (type === 'comment' ? 420 : 570)))
      };

      const reopenedPopup: SimplePopup = {
        id: dbChat.id,
        type: dbChat.type,
        position: safePosition,
        projectId: dbChat.projectId,
        chapterId: dbChat.chapterId, // Ensure chapterId is restored
        selectedText: dbChat.selectedText?.text || null, // Always provide a value (string or null)
        lineNumber: dbChat.lineNumber, // Ensure lineNumber is restored
        isMinimized: false,
        createdAt: dbChat.createdAt,
        messages: dbChat.messages || [],
        status: 'open',
        textPosition: dbChat.selectedText?.startOffset || null
      };

      console.log('Reopened popup with navigation data:', {
        chapterId: reopenedPopup.chapterId,
        lineNumber: reopenedPopup.lineNumber,
        textPosition: reopenedPopup.textPosition,
        selectedText: reopenedPopup.selectedText
      });

      setLivePopups(prevPopups => [...prevPopups, reopenedPopup]);
      setTimelineVersion(prev => prev + 1);

      await updateChatStatus(id, 'active');
      console.log('Popup reopened successfully with full navigation data:', id);
    } catch (error) {
      console.error('Error reopening popup:', error);
    }
  };

  const goToLine = useCallback(async (chapterId: string, lineNumber: number) => {
    console.log('Enhanced goToLine function called:', { chapterId, lineNumber });
    
    try {
      const currentPath = window.location.pathname;
      const targetPath = `/project/${projectId}/write/${chapterId}`;
      
      if (!currentPath.includes(chapterId)) {
        console.log('Navigating to different chapter:', targetPath);
        navigate(targetPath);
        
        // Wait for navigation and component mount, then scroll
        setTimeout(() => {
          scrollToLineEnhanced(lineNumber);
        }, 800);
      } else {
        console.log('Already on target chapter, scrolling to line:', lineNumber);
        scrollToLineEnhanced(lineNumber);
      }
    } catch (error) {
      console.error('Error in enhanced goToLine:', error);
    }
  }, [projectId, navigate]);

  const scrollToLineEnhanced = useCallback((lineNumber: number) => {
    try {
      console.log('Enhanced scroll to line:', lineNumber);
      
      // Find the textarea with more robust selectors
      const textareas = document.querySelectorAll('textarea');
      let textarea: HTMLTextAreaElement | null = null;
      
      // Try to find the main content textarea (usually the largest one)
      for (const ta of textareas) {
        if (ta.value && ta.value.length > 100) { // Find textarea with substantial content
          textarea = ta;
          break;
        }
      }
      
      if (!textarea && textareas.length > 0) {
        textarea = textareas[0]; // Fallback to first textarea
      }
      
      if (!textarea) {
        console.warn('No textarea found for line navigation');
        return;
      }

      const content = textarea.value;
      const lines = content.split('\n');
      
      if (lineNumber <= 0 || lineNumber > lines.length) {
        console.warn('Invalid line number for content:', { lineNumber, totalLines: lines.length });
        return;
      }

      // Calculate character position
      let charPosition = 0;
      for (let i = 0; i < lineNumber - 1; i++) {
        charPosition += lines[i].length + 1;
      }

      // Focus and set cursor position
      textarea.focus();
      textarea.setSelectionRange(charPosition, charPosition);

      // Enhanced scrolling calculation
      const computedStyle = getComputedStyle(textarea);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      
      // Calculate scroll position to center the line
      const targetScrollTop = (lineNumber - 1) * lineHeight;
      const textareaHeight = textarea.clientHeight;
      const centeredScrollTop = Math.max(0, targetScrollTop - (textareaHeight / 2) + paddingTop);
      
      // Smooth scroll to position
      textarea.scrollTo({
        top: centeredScrollTop,
        behavior: 'smooth'
      });
      
      // Add visual highlight effect
      const originalBorder = textarea.style.border;
      textarea.style.border = '2px solid #3b82f6';
      setTimeout(() => {
        textarea.style.border = originalBorder;
      }, 2000);
      
      console.log('Successfully scrolled to line:', lineNumber);
    } catch (error) {
      console.error('Error in enhanced scrollToLine:', error);
    }
  }, []);

  return (
    <SimplePopupsContext.Provider 
      value={{
        livePopups,
        popups: livePopups,
        createPopup,
        updatePopup,
        closePopup,
        deletePopup,
        reopenPopup,
        goToLine,
        timelineVersion
      }}
    >
      {children}
    </SimplePopupsContext.Provider>
  );
};
