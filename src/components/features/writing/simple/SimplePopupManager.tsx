
import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import { useChatDatabase } from '@/hooks/useChatDatabase';

export interface SimplePopup {
  id: string;
  type: 'comment' | 'chat';
  position: { x: number; y: number };
  projectId: string;
  chapterId?: string;
  selectedText?: string;
  lineNumber?: number;
  isMinimized: boolean;
  createdAt: Date;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  status: 'open' | 'closed';
  textPosition?: number | null;
}

interface SimplePopupsContextProps {
  livePopups: SimplePopup[];
  popups: SimplePopup[]; // Add alias for backward compatibility
  createPopup: (type: 'comment' | 'chat', position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string, lineNumber?: number) => void;
  updatePopup: (id: string, updates: Partial<SimplePopup>) => void;
  closePopup: (id: string) => void;
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
  const { saveChat, loadChatById, updateChatStatus } = useChatDatabase();

  // Function to create a new popup
  const createPopup = async (
    type: 'comment' | 'chat', 
    position: { x: number; y: number }, 
    projectId: string, 
    chapterId?: string, 
    selectedText?: string, 
    lineNumber?: number
  ) => {
    console.log('Creating popup:', { type, position, projectId, chapterId, selectedText, lineNumber });

    // Ensure position is within viewport bounds
    const safePosition = {
      x: Math.max(20, Math.min(position.x, window.innerWidth - 420)),
      y: Math.max(20, Math.min(position.y, window.innerHeight - 520))
    };

    const newPopup: SimplePopup = {
      id: uuidv4(),
      type,
      position: safePosition,
      projectId,
      chapterId,
      selectedText,
      lineNumber,
      isMinimized: false,
      createdAt: new Date(),
      messages: [],
      status: 'open',
      textPosition: null
    };

    // Add initial message for comment type
    if (type === 'comment' && selectedText) {
      newPopup.messages = [{
        role: 'assistant',
        content: `You're commenting on: "${selectedText}"\n\nWhat would you like to note about this text?`,
        timestamp: new Date()
      }];
    }

    // Add to state immediately
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

  // Function to update an existing popup
  const updatePopup = (id: string, updates: Partial<SimplePopup>) => {
    setLivePopups(prevPopups => 
      prevPopups.map(popup => 
        popup.id === id ? { ...popup, ...updates } : popup
      )
    );
    setTimelineVersion(prev => prev + 1);
  };

  // Function to close a popup
  const closePopup = async (id: string) => {
    setLivePopups(prevPopups => prevPopups.filter(popup => popup.id !== id));
    setTimelineVersion(prev => prev + 1);

    // Update status in database
    try {
      await updateChatStatus(id, 'closed');
      console.log('Popup marked as closed in database:', id);
    } catch (error) {
      console.error('Failed to update popup status:', error);
    }
  };

  // Function to reopen a popup - fixed signature and implementation
  const reopenPopup = async (
    id: string, 
    type: 'comment' | 'chat', 
    position: { x: number; y: number }, 
    projectId: string, 
    chapterId?: string, 
    selectedText?: string
  ) => {
    console.log('Reopening popup:', id);

    // Check if popup is already open
    const existingPopup = livePopups.find(popup => popup.id === id);
    if (existingPopup) {
      console.log('Popup is already open:', id);
      return;
    }

    try {
      // Load the existing popup from database
      const dbChat = await loadChatById(id);
      if (!dbChat) {
        console.error('Popup not found in database:', id);
        return;
      }

      // Calculate new safe position (slightly offset from original)
      const safePosition = {
        x: Math.max(20, Math.min(position.x + 30, window.innerWidth - 420)),
        y: Math.max(20, Math.min(position.y + 30, window.innerHeight - 520))
      };

      const reopenedPopup: SimplePopup = {
        id: dbChat.id,
        type: dbChat.type,
        position: safePosition,
        projectId: dbChat.projectId,
        chapterId: dbChat.chapterId,
        selectedText: dbChat.selectedText?.text,
        lineNumber: dbChat.lineNumber,
        isMinimized: false,
        createdAt: dbChat.createdAt,
        messages: dbChat.messages || [],
        status: 'open',
        textPosition: dbChat.selectedText?.startOffset
      };

      // Add to active popups
      setLivePopups(prevPopups => [...prevPopups, reopenedPopup]);
      setTimelineVersion(prev => prev + 1);

      // Update status in database
      await updateChatStatus(id, 'active');
      console.log('Popup reopened successfully:', id);
    } catch (error) {
      console.error('Error reopening popup:', error);
    }
  };

  const goToLine = useCallback(async (chapterId: string, lineNumber: number) => {
    console.log('Going to line:', { chapterId, lineNumber });
    try {
      // Navigate to the chapter first if it's different from current
      const currentPath = window.location.pathname;
      const targetPath = `/project/${projectId}/write/${chapterId}`;
      
      if (!currentPath.includes(chapterId)) {
        // Navigate to the chapter
        window.location.href = targetPath;
        // Wait for navigation and component mount
        setTimeout(() => {
          scrollToLine(lineNumber);
        }, 500);
      } else {
        // Already on the right chapter, just scroll
        scrollToLine(lineNumber);
      }
    } catch (error) {
      console.error('Error navigating to line:', error);
    }
  }, [projectId]);

  const scrollToLine = useCallback((lineNumber: number) => {
    try {
      // Find the textarea element
      const textarea = document.querySelector('textarea');
      if (!textarea) {
        console.warn('Textarea not found for line navigation');
        return;
      }

      const content = textarea.value;
      const lines = content.split('\n');
      
      if (lineNumber <= 0 || lineNumber > lines.length) {
        console.warn('Invalid line number:', lineNumber);
        return;
      }

      // Calculate the character position of the target line
      let charPosition = 0;
      for (let i = 0; i < lineNumber - 1; i++) {
        charPosition += lines[i].length + 1; // +1 for newline character
      }

      // Set cursor position to the beginning of the target line
      textarea.focus();
      textarea.setSelectionRange(charPosition, charPosition);

      // Calculate line height and scroll to make the line visible
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
      const scrollTop = (lineNumber - 1) * lineHeight;
      
      // Adjust scroll position to center the line in view
      const textareaHeight = textarea.clientHeight;
      const centeredScrollTop = Math.max(0, scrollTop - textareaHeight / 2);
      
      textarea.scrollTop = centeredScrollTop;
      console.log('Scrolled to line:', lineNumber);
    } catch (error) {
      console.error('Error scrolling to line:', error);
    }
  }, []);

  return (
    <SimplePopupsContext.Provider 
      value={{
        livePopups,
        popups: livePopups, // Add alias for backward compatibility
        createPopup,
        updatePopup,
        closePopup,
        reopenPopup,
        goToLine,
        timelineVersion
      }}
    >
      {children}
    </SimplePopupsContext.Provider>
  );
};
