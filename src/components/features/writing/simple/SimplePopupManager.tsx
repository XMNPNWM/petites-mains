import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  ReactNode
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';

// Define the types for the popup
export type PopupType = 'comment' | 'chat';

export interface Popup {
  id: string;
  type: PopupType;
  position: { x: number; y: number };
  projectId: string;
  chapterId?: string;
  selectedText?: string;
  lineNumber?: number;
  isMinimized: boolean;
  createdAt: Date;
  messages?: any[];
  status?: string;
  textPosition?: number;
}

interface SimplePopupsContextProps {
  livePopups: Popup[];
  createPopup: (type: PopupType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string, lineNumber?: number) => void;
  updatePopup: (id: string, updates: Partial<Popup>) => void;
  closePopup: (id: string) => void;
  reopenPopup: (id: string) => void;
  goToLine: (chapterId: string, lineNumber: number) => void;
  timelineVersion: number;
}

const SimplePopupsContext = createContext<SimplePopupsContextProps | undefined>(
  undefined
);

export const useSimplePopups = () => {
  const context = useContext(SimplePopupsContext);
  if (!context) {
    throw new Error(
      'useSimplePopups must be used within a SimplePopupProvider'
    );
  }
  return context;
};

interface SimplePopupProviderProps {
  children: ReactNode;
}

export const SimplePopupProvider: React.FC<SimplePopupProviderProps> = ({
  children,
}) => {
  const [livePopups, setLivePopups] = useState<Popup[]>([]);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const { projectId } = useParams();

  // Function to create a new popup
  const createPopup = (
    type: PopupType,
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string,
    lineNumber?: number
  ) => {
    const newPopup: Popup = {
      id: uuidv4(),
      type,
      position,
      projectId,
      chapterId,
      selectedText,
      lineNumber,
      isMinimized: false,
      createdAt: new Date(),
      messages: [],
      status: 'open',
      textPosition: null,
    };

    setLivePopups((prevPopups) => [...prevPopups, newPopup]);
    setTimelineVersion((prev) => prev + 1);
  };

  // Function to update an existing popup
  const updatePopup = (id: string, updates: Partial<Popup>) => {
    setLivePopups((prevPopups) =>
      prevPopups.map((popup) => (popup.id === id ? { ...popup, ...updates } : popup))
    );
    setTimelineVersion((prev) => prev + 1);
  };

  // Function to close a popup
  const closePopup = (id: string) => {
    setLivePopups((prevPopups) => prevPopups.filter((popup) => popup.id !== id));
    setTimelineVersion((prev) => prev + 1);
  };

  // Function to reopen a popup
  const reopenPopup = (id: string) => {
    setLivePopups((prevPopups) =>
      prevPopups.map((popup) =>
        popup.id === id ? { ...popup, isMinimized: false } : popup
      )
    );
    setTimelineVersion((prev) => prev + 1);
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
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
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
