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
  selectedText: string | null; // Required to match Popup interface
  lineNumber: number | null; // Made required to match Popup interface
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
    console.log('Creating popup with validated navigation data:', { 
      type, position, projectId, chapterId, selectedText, lineNumber,
      hasValidNavigation: !!(chapterId && lineNumber && lineNumber > 0)
    });

    const safePosition = {
      x: Math.max(20, Math.min(position.x, window.innerWidth - (type === 'comment' ? 370 : 470))),
      y: Math.max(20, Math.min(position.y, window.innerHeight - (type === 'comment' ? 420 : 570)))
    };

    // Enhanced text position calculation - only when we have valid line number
    let textPosition: number | null = null;
    if (selectedText && lineNumber && lineNumber > 0) {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const lines = textarea.value.split('\n');
        let charPosition = 0;
        for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
          if (lines[i]) {
            charPosition += lines[i].length + 1; // +1 for newline
          }
        }
        // Find the position of the selected text within the line
        if (lines[lineNumber - 1]) {
          const textInLine = lines[lineNumber - 1].indexOf(selectedText);
          if (textInLine >= 0) {
            textPosition = charPosition + textInLine;
          }
        }
      }
    }

    const newPopup: SimplePopup = {
      id: uuidv4(),
      type,
      position: safePosition,
      projectId,
      chapterId,
      selectedText: selectedText || null,
      lineNumber: (lineNumber && lineNumber > 0) ? lineNumber : null,
      isMinimized: false,
      createdAt: new Date(),
      messages: [],
      status: 'open',
      textPosition: textPosition
    };

    console.log('Created popup with final navigation data:', {
      id: newPopup.id,
      lineNumber: newPopup.lineNumber,
      textPosition: newPopup.textPosition,
      selectedText: newPopup.selectedText,
      chapterId: newPopup.chapterId,
      hasValidNavigation: !!(newPopup.chapterId && newPopup.lineNumber)
    });

    // Add contextual initial messages
    if (type === 'comment') {
      if (selectedText && lineNumber) {
        newPopup.messages = [{
          role: 'assistant',
          content: `You're commenting on line ${lineNumber}: "${selectedText}"\n\nWhat would you like to note about this text?`,
          timestamp: new Date()
        }];
      } else {
        newPopup.messages = [{
          role: 'assistant',
          content: `Comment created. What would you like to note?`,
          timestamp: new Date()
        }];
      }
    } else if (type === 'chat') {
      newPopup.messages = [{
        role: 'assistant',
        content: `Hello! I'm your AI writing assistant. I have access to all your project chapters and I'm here to help you with your story. What would you like to discuss?`,
        timestamp: new Date()
      }];
    }

    setLivePopups(prevPopups => [...prevPopups, newPopup]);
    setTimelineVersion(prev => prev + 1);

    // Enhanced database save with validated navigation data
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
      console.log('Popup saved to database with validated navigation data:', {
        id: newPopup.id,
        lineNumber: newPopup.lineNumber,
        chapterId: newPopup.chapterId,
        hasValidNavigation: !!(newPopup.chapterId && newPopup.lineNumber)
      });
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
    console.log('Reopening popup with navigation data restoration:', id);

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

      console.log('Loaded chat data with navigation validation:', {
        id: dbChat.id,
        chapterId: dbChat.chapterId,
        lineNumber: dbChat.lineNumber,
        selectedText: dbChat.selectedText,
        hasValidNavigation: !!(dbChat.chapterId && dbChat.lineNumber)
      });

      const safePosition = {
        x: Math.max(20, Math.min(position.x + 30, window.innerWidth - (type === 'comment' ? 370 : 470))),
        y: Math.max(20, Math.min(position.y + 30, window.innerHeight - (type === 'comment' ? 420 : 570)))
      };

      const reopenedPopup: SimplePopup = {
        id: dbChat.id,
        type: dbChat.type,
        position: safePosition,
        projectId: dbChat.projectId,
        chapterId: dbChat.chapterId,
        selectedText: dbChat.selectedText?.text || null,
        lineNumber: dbChat.lineNumber || null,
        isMinimized: false,
        createdAt: dbChat.createdAt,
        messages: dbChat.messages || [],
        status: 'open',
        textPosition: dbChat.selectedText?.startOffset || null
      };

      console.log('Reopened popup with navigation data verified:', {
        id: reopenedPopup.id,
        chapterId: reopenedPopup.chapterId,
        lineNumber: reopenedPopup.lineNumber,
        textPosition: reopenedPopup.textPosition,
        selectedText: reopenedPopup.selectedText,
        hasValidNavigation: !!(reopenedPopup.chapterId && reopenedPopup.lineNumber)
      });

      setLivePopups(prevPopups => [...prevPopups, reopenedPopup]);
      setTimelineVersion(prev => prev + 1);

      await updateChatStatus(id, 'active');
      console.log('Popup reopened successfully with navigation data validated');
    } catch (error) {
      console.error('Error reopening popup:', error);
    }
  };

  const goToLine = useCallback(async (chapterId: string, lineNumber: number) => {
    console.log('Enhanced goToLine function called with validation:', { chapterId, lineNumber });
    
    // Input validation
    if (!chapterId || !lineNumber || lineNumber < 1) {
      console.error('Invalid navigation parameters:', { chapterId, lineNumber });
      return;
    }

    try {
      const currentPath = window.location.pathname;
      const targetPath = `/project/${projectId}/write/${chapterId}`;
      
      if (!currentPath.includes(chapterId)) {
        console.log('Navigating to different chapter:', targetPath);
        navigate(targetPath);
        
        // Wait for navigation and component mount, then scroll
        setTimeout(() => {
          scrollToLineEnhanced(lineNumber);
        }, 1000); // Increased timeout for better reliability
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
      console.log('Enhanced scroll to line with validation:', lineNumber);
      
      // Find the textarea with more robust selectors
      const textareas = document.querySelectorAll('textarea');
      let textarea: HTMLTextAreaElement | null = null;
      
      // Try to find the main content textarea (usually the largest one)
      for (const ta of textareas) {
        if (ta.value && ta.value.length > 50) { // Lower threshold for more flexibility
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
        console.warn('Invalid line number for content:', { 
          requestedLine: lineNumber, 
          totalLines: lines.length,
          hasContent: content.length > 0
        });
        return;
      }

      // Calculate character position with validation
      let charPosition = 0;
      for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
        charPosition += lines[i].length + 1; // +1 for newline
      }

      // Focus and set cursor position
      textarea.focus();
      textarea.setSelectionRange(charPosition, charPosition);

      // Enhanced scrolling calculation with error handling
      const computedStyle = getComputedStyle(textarea);
      const lineHeight = Math.max(parseFloat(computedStyle.lineHeight) || 24, 20);
      const paddingTop = parseFloat(computedStyle.paddingTop) || 8;
      
      // Calculate scroll position to center the line
      const targetScrollTop = Math.max(0, (lineNumber - 1) * lineHeight);
      const textareaHeight = textarea.clientHeight;
      const centeredScrollTop = Math.max(0, targetScrollTop - (textareaHeight / 2) + paddingTop);
      
      // Smooth scroll to position
      textarea.scrollTo({
        top: centeredScrollTop,
        behavior: 'smooth'
      });
      
      // Enhanced visual highlight effect
      const originalBorder = textarea.style.border;
      const originalBoxShadow = textarea.style.boxShadow;
      
      textarea.style.border = '3px solid #3b82f6';
      textarea.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.3)';
      
      setTimeout(() => {
        textarea.style.border = originalBorder;
        textarea.style.boxShadow = originalBoxShadow;
      }, 2500);
      
      console.log('Successfully navigated to line with enhanced feedback:', {
        lineNumber,
        charPosition,
        scrollTop: centeredScrollTop,
        lineHeight
      });
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
